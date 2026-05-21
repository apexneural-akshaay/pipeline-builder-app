import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const NODE_RUNNER = path.resolve(__dirname, "..", "..", "runtime", "node_runner.py");
const RUNS_DIR = path.resolve(__dirname, "..", "..", "runs");
if (!fs.existsSync(RUNS_DIR)) fs.mkdirSync(RUNS_DIR, { recursive: true });

/** Resolve a real, working Python executable.
 *  On Windows, "python" in PATH often points at the Microsoft Store stub which hangs
 *  silently when spawned by a child process. We probe candidates to find a real one.
 */
function resolvePython(): string {
  if (process.env.PYTHON_CMD) return process.env.PYTHON_CMD;
  const { execSync } = require("child_process");
  const candidates: string[] = [];

  // Try the `py` launcher first — Windows official way to find the real interpreter
  for (const cmd of ["py -3", "py"]) {
    try {
      const out = execSync(`${cmd} -c "import sys; print(sys.executable)"`, { encoding: "utf8", timeout: 5000 });
      const path = out.trim();
      if (path && !path.toLowerCase().includes("windowsapps")) candidates.push(path);
    } catch {}
  }

  // Probe each "python" / "python3" / "python.exe" entry on PATH, skipping the Store stub
  for (const cmd of ["python", "python3", "python.exe"]) {
    try {
      const out = execSync(`${process.platform === "win32" ? "where" : "which"} ${cmd}`, { encoding: "utf8", timeout: 5000 });
      for (const line of out.split(/\r?\n/)) {
        const path = line.trim();
        if (!path) continue;
        if (path.toLowerCase().includes("windowsapps")) continue;  // Skip MS Store stub
        candidates.push(path);
      }
    } catch {}
  }

  // Pick the first candidate that actually loads Python successfully (not the Store stub)
  for (const c of candidates) {
    try {
      const out = execSync(`"${c}" -c "import sys; print(sys.version_info[:2])"`, { encoding: "utf8", timeout: 5000 });
      if (/\(\d/.test(out)) {
        console.log(`runtime: using python at ${c}`);
        return c;
      }
    } catch {}
  }

  console.warn("runtime: no real Python found; falling back to 'python' on PATH (may hang on Windows Store stub)");
  return "python";
}

export const PYTHON_CMD = resolvePython();

export interface NodeTestRequest {
  nodeType: string;
  config: Record<string, any>;
  upstream?: any;
}

export interface RunningPipeline {
  id: string;
  startedAt: number;
  status: "running" | "stopped" | "exited" | "failed";
  exitCode: number | null;
  proc: ChildProcessWithoutNullStreams | null;
  logs: { time: number; stream: "stdout" | "stderr" | "meta"; line: string }[];
  listeners: Set<(line: { time: number; stream: string; line: string }) => void>;
  workDir: string;
}

@Injectable()
export class RuntimeService {
  private runs = new Map<string, RunningPipeline>();

  // ─── Per-node test ───────────────────────────────────────

  async testNode(req: NodeTestRequest): Promise<any> {
    if (!req?.nodeType) throw new BadRequestException("nodeType required");
    return new Promise((resolve, reject) => {
      const proc = spawn(PYTHON_CMD, [NODE_RUNNER, req.nodeType, JSON.stringify(req.config ?? {})]);
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", (err) => reject(new InternalServerErrorException(err.message)));
      proc.on("close", () => {
        // The runner always prints exactly one JSON object on stdout
        try {
          const parsed = JSON.parse(stdout.trim().split("\n").pop() || "{}");
          resolve({ ...parsed, stderr_tail: stderr.split("\n").slice(-20).join("\n") });
        } catch (e: any) {
          resolve({ ok: false, error: "Failed to parse runner output", stdout, stderr });
        }
      });

      if (req.upstream !== undefined && req.upstream !== null) {
        proc.stdin.write(JSON.stringify(req.upstream));
      }
      proc.stdin.end();
    });
  }

  // ─── Full pipeline run ───────────────────────────────────

  startPipeline(code: string): { runId: string } {
    const runId = randomUUID();
    const workDir = path.join(RUNS_DIR, runId);
    fs.mkdirSync(workDir, { recursive: true });
    const scriptPath = path.join(workDir, "inference.py");
    fs.writeFileSync(scriptPath, code, "utf8");

    const proc = spawn(PYTHON_CMD, ["-u", scriptPath], {
      cwd: workDir,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      // Important: explicit stdio so Node doesn't keep a stdin pipe open that
      // would let Python's stdin block stdout flushing on Windows.
      stdio: ["ignore", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;

    const record: RunningPipeline = {
      id: runId,
      startedAt: Date.now(),
      status: "running",
      exitCode: null,
      proc,
      logs: [],
      listeners: new Set(),
      workDir,
    };
    this.runs.set(runId, record);

    const append = (stream: "stdout" | "stderr" | "meta", line: string) => {
      const entry = { time: Date.now(), stream, line };
      record.logs.push(entry);
      if (record.logs.length > 5000) record.logs.shift();
      record.listeners.forEach((l) => {
        try { l(entry); } catch {}
      });
    };

    proc.stdout.on("data", (d) =>
      d.toString().split(/\r?\n/).forEach((l: string) => l && append("stdout", l)),
    );
    proc.stderr.on("data", (d) =>
      d.toString().split(/\r?\n/).forEach((l: string) => l && append("stderr", l)),
    );
    proc.on("error", (err) => {
      append("meta", `[runtime] spawn error: ${err.message}`);
      record.status = "failed";
      record.proc = null;
    });
    proc.on("close", (code) => {
      record.status = record.status === "stopped" ? "stopped" : "exited";
      record.exitCode = code;
      record.proc = null;
      append("meta", `[runtime] process exited with code ${code}`);
    });

    append("meta", `[runtime] starting inference.py in ${workDir}`);
    return { runId };
  }

  stopPipeline(runId: string): { ok: boolean } {
    const r = this.runs.get(runId);
    if (!r) throw new BadRequestException("Unknown run id");
    if (r.proc) {
      r.status = "stopped";
      try { r.proc.kill("SIGTERM"); } catch {}
      // Force-kill after a grace period
      setTimeout(() => {
        if (r.proc && !r.proc.killed) {
          try { r.proc.kill("SIGKILL"); } catch {}
        }
      }, 3000);
    }
    return { ok: true };
  }

  getRun(runId: string): RunningPipeline | undefined {
    return this.runs.get(runId);
  }

  listRuns() {
    return Array.from(this.runs.values()).map((r) => ({
      id: r.id,
      startedAt: r.startedAt,
      status: r.status,
      exitCode: r.exitCode,
      logCount: r.logs.length,
    }));
  }
}
