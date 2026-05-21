import { Injectable, BadRequestException } from "@nestjs/common";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { PYTHON_CMD } from "../runtime/runtime.service";
import { CATALOG } from "../../../shared/yolo-catalog";

const MODELS_DIR = path.resolve(__dirname, "..", "..", "models");
const DOWNLOADER = path.resolve(__dirname, "..", "..", "runtime", "download_weight.py");

if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

export type DownloadStatus = "queued" | "downloading" | "done" | "error";

export interface DownloadJob {
  filename: string;
  status: DownloadStatus;
  startedAt: number;
  finishedAt?: number;
  error?: string;
  proc?: ChildProcessWithoutNullStreams;
}

/** Build the set of filenames the catalog knows about — only these are downloadable. */
function catalogFilenames(): Set<string> {
  const set = new Set<string>();
  for (const fam of CATALOG) {
    for (const task of fam.tasks) {
      for (const v of task.variants) {
        if (v.downloadable) set.add(v.filename);
      }
    }
  }
  return set;
}

@Injectable()
export class DownloadsService {
  /** Active + recent jobs keyed by filename. */
  private jobs = new Map<string, DownloadJob>();
  private listeners = new Set<(job: DownloadJob) => void>();
  private allowed = catalogFilenames();

  /** Start a download (or return the existing in-flight job for that filename). */
  start(filename: string): DownloadJob {
    if (!this.allowed.has(filename)) {
      throw new BadRequestException(`Unknown or non-downloadable weight: ${filename}`);
    }
    const existing = this.jobs.get(filename);
    if (existing && (existing.status === "queued" || existing.status === "downloading")) {
      return this.publicJob(existing);
    }

    const job: DownloadJob = {
      filename,
      status: "queued",
      startedAt: Date.now(),
    };
    this.jobs.set(filename, job);

    // If the file is somehow already on disk, short-circuit.
    const dest = path.join(MODELS_DIR, filename);
    if (fs.existsSync(dest)) {
      job.status = "done";
      job.finishedAt = Date.now();
      this.notify(job);
      return this.publicJob(job);
    }

    const proc = spawn(PYTHON_CMD, ["-u", DOWNLOADER, filename, MODELS_DIR], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    job.proc = proc;
    job.status = "downloading";
    this.notify(job);

    let stdoutBuf = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString("utf8");
      let nl;
      while ((nl = stdoutBuf.indexOf("\n")) >= 0) {
        const line = stdoutBuf.slice(0, nl).trim();
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.event === "error") {
            job.status = "error";
            job.error = String(evt.message ?? "download failed");
          }
        } catch {
          // ignore non-JSON lines from Python
        }
      }
    });

    let stderrBuf = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf8");
    });

    proc.on("close", (code) => {
      if (job.status !== "error") {
        if (code === 0 && fs.existsSync(dest)) {
          job.status = "done";
        } else {
          job.status = "error";
          job.error = job.error || stderrBuf.trim().slice(-400) || `python exited with code ${code}`;
        }
      }
      job.finishedAt = Date.now();
      job.proc = undefined;
      this.notify(job);
    });

    return this.publicJob(job);
  }

  /** Cancel an in-flight download. No-op if not running. */
  cancel(filename: string): void {
    const job = this.jobs.get(filename);
    if (!job || !job.proc) return;
    job.proc.kill("SIGTERM");
    setTimeout(() => job.proc?.kill("SIGKILL"), 3000);
  }

  /** Snapshot of every job we know about. */
  list(): DownloadJob[] {
    return Array.from(this.jobs.values()).map((j) => this.publicJob(j));
  }

  get(filename: string): DownloadJob | undefined {
    const j = this.jobs.get(filename);
    return j ? this.publicJob(j) : undefined;
  }

  subscribe(fn: (job: DownloadJob) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(job: DownloadJob) {
    const snap = this.publicJob(job);
    for (const l of this.listeners) {
      try { l(snap); } catch {}
    }
  }

  /** Strip the process handle before sending to clients. */
  private publicJob(j: DownloadJob): DownloadJob {
    const { proc, ...rest } = j;
    return rest as DownloadJob;
  }
}
