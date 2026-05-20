import { Body, Controller, Get, Param, Post, Res, BadRequestException } from "@nestjs/common";
import { Response } from "express";
import { RuntimeService, NodeTestRequest } from "./runtime.service";
import { AssemblerService, PipelineJson } from "../pipelines/assembler.service";

@Controller()
export class RuntimeController {
  constructor(
    private readonly runtime: RuntimeService,
    private readonly assembler: AssemblerService,
  ) {}

  // ─── Per-node tester ─────────────────────────────────────
  @Post("nodes/test")
  async testNode(@Body() req: NodeTestRequest) {
    return this.runtime.testNode(req);
  }

  // ─── Full pipeline runner ────────────────────────────────
  @Post("pipelines/run")
  startPipeline(@Body() pipeline: PipelineJson) {
    const code = this.assembler.compile(pipeline);
    return this.runtime.startPipeline(code);
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
