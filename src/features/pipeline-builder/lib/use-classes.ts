"use client";

import { useEffect, useState } from "react";

const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

export interface ClassesData {
  source: string;
  label?: string;
  class_count: number;
  classes: string[];
  is_freeform: boolean;
}

const cache = new Map<string, ClassesData>();

/**
 * Fetch the class list for the chosen model.
 * Prefer `filename` (returns the *exact* dataset the model was trained on),
 * fall back to `task` (returns the default dataset for that task).
 */
export function useClasses(taskOrFilename: {
  task?: string;
  filename?: string;
} | string | undefined | null) {
  // Back-compat: callers can pass a bare task string.
  const args =
    typeof taskOrFilename === "string"
      ? { task: taskOrFilename, filename: undefined }
      : taskOrFilename ?? { task: undefined, filename: undefined };

  const cacheKey = args.filename
    ? `f:${args.filename}`
    : args.task
      ? `t:${args.task}`
      : "";

  const [data, setData] = useState<ClassesData | null>(cacheKey ? cache.get(cacheKey) ?? null : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cacheKey) return;
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      return;
    }
    let live = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (args.filename) params.set("filename", args.filename);
    if (args.task) params.set("task", args.task);

    fetch(`${BACKEND}/models/classes?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        const out: ClassesData = {
          source: d.source ?? "?",
          label: d.label,
          class_count: typeof d.class_count === "number" ? d.class_count : (d.classes?.length ?? 0),
          classes: Array.isArray(d.classes) ? d.classes : [],
          is_freeform: d.is_freeform === true,
        };
        cache.set(cacheKey, out);
        setData(out);
      })
      .catch(() => {
        if (live) setData({ source: "?", class_count: 0, classes: [], is_freeform: false });
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => { live = false; };
  }, [cacheKey]);

  return { data, loading };
}
