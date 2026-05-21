import { Body, Controller, Get, Param, Post, Res, BadRequestException } from "@nestjs/common";
import { Response } from "express";
import { RuntimeService, NodeTestRequest } from "./runtime.service";
import { AssemblerService, PipelineJson } from "../pipelines/assembler.service";
import { DownloadsService } from "../models/downloads.service";
import { findVariant, remapSize } from "../../../shared/yolo-catalog";

@Controller()
export class RuntimeController {
  constructor(
    private readonly runtime: RuntimeService,
    private readonly assembler: AssemblerService,
    private readonly downloads: DownloadsService,
  ) {}

  // ─── Per-node tester ─────────────────────────────────────
  @Post("nodes/test")
  async testNode(@Body() req: NodeTestRequest) {
    return this.runtime.testNode(req);
  }

  // ─── Full pipeline runner ────────────────────────────────
  @Post("pipelines/run")
  async startPipeline(@Body() pipeline: PipelineJson) {
    // Pre-download any yolo_model weights that are missing on disk. This keeps
    // .pt files in backend/models/ (where /models can see them and reuse them
    // for future runs) instead of letting Ultralytics dump them into the
    // per-run cwd, where they'd be re-downloaded every time.
    await this.ensureWeights(pipeline);
    const code = this.assembler.compile(pipeline);
    return this.runtime.startPipeline(code);
  }

  /** Walk yolo_model nodes, kick off downloads for any whose .pt isn't on disk,
   *  and wait for each to finish (or fail). Errors are reported back as HTTP. */
  private async ensureWeights(pipeline: PipelineJson): Promise<void> {
    if (!pipeline?.nodes) return;
    const needed = new Set<string>();
    for (const n of pipeline.nodes) {
      if (n.type !== "yolo_model") continue;
      const cfg = n.config || {};
      // Explicit weights override → trust the user
      if (typeof cfg.weights === "string" && cfg.weights.trim()) continue;
      const version = String(cfg.version ?? "yolo26").toLowerCase();
      const task = String(cfg.task ?? "detect").toLowerCase();
      let size = String(cfg.size ?? "n").toLowerCase();
      let v = findVariant(version, task, size);
      if (!v) {
        size = remapSize(version, size);
        v = findVariant(version, task, size);
      }
      if (v && v.downloadable) needed.add(v.filename);
    }

    for (const fname of needed) {
      try {
        await this.downloadAndWait(fname);
      } catch (e: any) {
        throw new BadRequestException(`Failed to fetch weights ${fname}: ${e?.message ?? e}`);
      }
    }
  }

  private downloadAndWait(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const job = this.downloads.start(filename);
      if (job.status === "done") return resolve();
      if (job.status === "error") return reject(new Error(job.error || "unknown"));
      const unsub = this.downloads.subscribe((j) => {
        if (j.filename !== filename) return;
        if (j.status === "done") { unsub(); resolve(); }
        else if (j.status === "error") { unsub(); reject(new Error(j.error || "download failed")); }
      });
    });
  }

  @Post("pipelines/runs/:id/stop")
  stopPipeline(@Param("id") id: string) {
    return this.runtime.stopPipeline(id);
  }

  @Get("pipelines/runs")
  listRuns() {
    return { runs: this.runtime.listRuns() };
  }

  @Get("pipelines/runs/:id")
  getRun(@Param("id") id: string) {
    const r = this.runtime.getRun(id);
    if (!r) throw new BadRequestException("Unknown run id");
    return {
      id: r.id,
      status: r.status,
      startedAt: r.startedAt,
      exitCode: r.exitCode,
      logs: r.logs,
    };
  }

  /** Server-Sent Events stream of logs as they arrive. */
  @Get("pipelines/runs/:id/stream")
  stream(@Param("id") id: string, @Res() res: Response) {
    const r = this.runtime.getRun(id);
    if (!r) {
      res.status(400).json({ error: "Unknown run id" });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Replay existing logs
    for (const entry of r.logs) {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }
    res.write(`event: status\ndata: ${JSON.stringify({ status: r.status })}\n\n`);

    const listener = (entry: any) => {
      try { res.write(`data: ${JSON.stringify(entry)}\n\n`); } catch {}
    };
    r.listeners.add(listener);

    // Status check + heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: status\ndata: ${JSON.stringify({ status: r.status, exitCode: r.exitCode })}\n\n`);
        if (r.status !== "running") {
          clearInterval(heartbeat);
          res.end();
        }
      } catch {
        clearInterval(heartbeat);
      }
    }, 2000);

    res.on("close", () => {
      r.listeners.delete(listener);
      clearInterval(heartbeat);
    });
  }
}
