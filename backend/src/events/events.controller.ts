import { Controller, Get, Param, Res, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

/* Reads events written by the generated pipeline runtime into ./events/events.jsonl.
   For the demo we serve from the backend folder, but in a real deploy each pipeline
   writes to its own folder and the backend would scan all of them. */
const EVENTS_DIR = path.resolve(__dirname, "..", "..", "events");

/** On import, reap any stranded ffmpeg transcode tmp files left by a previous run.
 *  Also drops 0-byte / very small (truncated) MP4s that would fail to play. */
function reapTranscodeTmps() {
  if (!fs.existsSync(EVENTS_DIR)) return;
  for (const f of fs.readdirSync(EVENTS_DIR)) {
    const full = path.join(EVENTS_DIR, f);
    if (f.endsWith(".mp4.tmp.mp4")) {
      const final = path.join(EVENTS_DIR, f.replace(".mp4.tmp.mp4", ".mp4"));
      try {
        if (fs.existsSync(final)) fs.renameSync(full, final);
      } catch {}
      continue;
    }
    // Tiny / truncated MP4s left over from a hard-killed pipeline — these have no
    // moov atom and break the events page video element. Drop them.
    if (f.endsWith(".mp4")) {
      try {
        const st = fs.statSync(full);
        if (st.size < 1024) fs.unlinkSync(full);
      } catch {}
    }
  }
}
reapTranscodeTmps();

@Controller("events")
export class EventsController {
  @Get()
  list() {
    reapTranscodeTmps();
    if (!fs.existsSync(EVENTS_DIR)) return { events: [] };
    const indexPath = path.join(EVENTS_DIR, "events.jsonl");
    if (!fs.existsSync(indexPath)) return { events: [] };
    const lines = fs.readFileSync(indexPath, "utf8").split("\n").filter(Boolean);
    const events = lines
      .map((l) => {
        try { return JSON.parse(l); } catch { return null; }
      })
      .filter(Boolean)
      .reverse(); // newest first
    return { events };
  }

  @Get("file/:filename")
  file(@Param("filename") filename: string, @Res() res: Response) {
    // basic path-traversal guard
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      throw new NotFoundException();
    }
    const fp = path.join(EVENTS_DIR, filename);
    if (!fs.existsSync(fp)) throw new NotFoundException();
    res.sendFile(fp);
  }
}
