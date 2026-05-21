"use client";

import { useCallback, useEffect, useState } from "react";

const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

export interface DownloadJob {
  filename: string;
  status: "queued" | "downloading" | "done" | "error" | "unknown";
  startedAt?: number;
  finishedAt?: number;
  error?: string;
}

/**
 * Tracks model-download jobs. Opens an SSE stream to the backend so the picker
 * updates in real time as jobs progress.
 *
 * Exposes:
 *   jobs[filename] → latest job snapshot
 *   start(filename) → kick off a download
 *   cancel(filename) → cancel an in-flight download
 *   onDone(cb) → register a callback fired when any job transitions to "done"
 */
export function useDownloads(onDone?: (filename: string) => void) {
  const [jobs, setJobs] = useState<Record<string, DownloadJob>>({});

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    try {
      es = new EventSource(`${BACKEND}/models/downloads/stream/events`);
      es.onmessage = (ev) => {
        try {
          const job: DownloadJob = JSON.parse(ev.data);
          setJobs((prev) => ({ ...prev, [job.filename]: job }));
          if (job.status === "done") onDone?.(job.filename);
        } catch {
          // ignore
        }
      };
      es.onerror = () => {
        // Browser will auto-reconnect; nothing to do.
      };
    } catch {
      // EventSource unsupported — no-op.
    }

    return () => {
      closed = true;
      es?.close();
    };
  }, [onDone]);

  const start = useCallback(async (filename: string) => {
    setJobs((prev) => ({ ...prev, [filename]: { filename, status: "queued" } }));
    try {
      const r = await fetch(`${BACKEND}/models/downloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!r.ok) {
        const t = await r.text();
        setJobs((prev) => ({ ...prev, [filename]: { filename, status: "error", error: t } }));
      }
    } catch (e: any) {
      setJobs((prev) => ({ ...prev, [filename]: { filename, status: "error", error: e?.message ?? "network error" } }));
    }
  }, []);

  const cancel = useCallback(async (filename: string) => {
    try {
      await fetch(`${BACKEND}/models/downloads/${encodeURIComponent(filename)}/cancel`, {
        method: "POST",
      });
    } catch {
      // ignore — server-side cancel is best-effort
    }
  }, []);

  return { jobs, start, cancel };
}
