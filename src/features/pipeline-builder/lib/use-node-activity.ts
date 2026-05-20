"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "./runtime-api";

export interface NodeActivity {
  frames?: number;
  detections?: number;
  passed?: number;
  fired?: number;
  /** Wall-clock time the most recent heartbeat arrived for this node. */
  lastBeatAt: number;
}

const ACTIVE_WINDOW_MS = 2500;

/** Parses `@HB <node> k=v k=v` lines from the log stream into per-node stats.
 *  Also returns `activeId`: the node whose most recent heartbeat is within the last 2.5s. */
export function useNodeActivity(logs: LogEntry[]) {
  const [activity, setActivity] = useState<Record<string, NodeActivity>>({});
  const [now, setNow] = useState<number>(() => Date.now());
  const seenRef = useRef(0);

  useEffect(() => {
    // Process only newly-arrived log entries to avoid O(n²) on each render.
    let changed = false;
    const next = { ...activity };
    for (let i = seenRef.current; i < logs.length; i++) {
      const l = logs[i];
      if (l.stream !== "stdout") continue;
      const m = /^@HB\s+(\S+)\s+(.*)$/.exec(l.line);
      if (!m) continue;
      const node = m[1];
      const stats: NodeActivity = { ...(next[node] ?? { lastBeatAt: 0 }), lastBeatAt: l.time };
      for (const kv of m[2].split(/\s+/)) {
        const [k, v] = kv.split("=");
        const n = Number(v);
        if (!Number.isNaN(n)) (stats as any)[k] = n;
      }
      next[node] = stats;
      changed = true;
    }
    seenRef.current = logs.length;
    if (changed) setActivity(next);
  }, [logs, activity]);

  // Tick once a second so the "active" highlight fades correctly.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const activeId = useMemo(() => {
    let best: { id: string; at: number } | null = null;
    for (const [id, a] of Object.entries(activity)) {
      if (now - a.lastBeatAt > ACTIVE_WINDOW_MS) continue;
      if (!best || a.lastBeatAt > best.at) best = { id, at: a.lastBeatAt };
    }
    return best?.id ?? null;
  }, [activity, now]);

  return { activity, activeId };
}
