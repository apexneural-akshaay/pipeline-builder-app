"use client";

import { useEffect, useState } from "react";

const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

const cache = new Map<string, { source: string; classes: string[] }>();

export function useClasses(task: string | undefined | null) {
  const [data, setData] = useState<{ source: string; classes: string[] } | null>(
    task ? cache.get(task) ?? null : null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) return;
    if (cache.has(task)) {
      setData(cache.get(task)!);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`${BACKEND}/models/classes?task=${encodeURIComponent(task)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        const out = { source: d.source ?? "?", classes: Array.isArray(d.classes) ? d.classes : [] };
        cache.set(task, out);
        setData(out);
      })
      .catch(() => {
        if (live) setData({ source: "?", classes: [] });
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => { live = false; };
  }, [task]);

  return { data, loading };
}
