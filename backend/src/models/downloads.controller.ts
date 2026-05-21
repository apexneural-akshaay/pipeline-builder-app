import { Body, Controller, Get, Param, Post, Res, Sse, MessageEvent } from "@nestjs/common";
import { Response } from "express";
import { Observable } from "rxjs";
import { DownloadsService, DownloadJob } from "./downloads.service";

@Controller("models/downloads")
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  /** POST /models/downloads — body: { filename } → starts (or reuses) a download. */
  @Post()
  start(@Body() body: { filename?: string }) {
    const filename = (body?.filename ?? "").trim();
    return this.downloads.start(filename);
  }

  /** GET /models/downloads — snapshot of all jobs. */
  @Get()
  list() {
    return { jobs: this.downloads.list() };
  }

  /** GET /models/downloads/:filename — single job snapshot. */
  @Get(":filename")
  one(@Param("filename") filename: string) {
    return this.downloads.get(filename) ?? { filename, status: "unknown" };
  }

  /** POST /models/downloads/:filename/cancel — terminate an in-flight job. */
  @Post(":filename/cancel")
  cancel(@Param("filename") filename: string) {
    this.downloads.cancel(filename);
    return { ok: true };
  }

  /** GET /models/downloads/stream — SSE feed of all status changes. */
  @Sse("stream/events")
  stream(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      // Replay current snapshot once on connect so clients have full state.
      for (const j of this.downloads.list()) {
        subscriber.next({ data: j } as MessageEvent);
      }
      const unsub = this.downloads.subscribe((j: DownloadJob) => {
        subscriber.next({ data: j } as MessageEvent);
      });
      return () => unsub();
    });
  }
}
