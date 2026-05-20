"use client";

import { useEffect, useState } from "react";

export interface ModelTask {
  id: string;
  label: string;
  sizes: { size: string; filename: string; available: boolean }[];
}
export interface ModelVersion {
  id: string;
  label: string;
  tasks: ModelTask[];
}

const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

let cache: ModelVersion[] | null = null;
let pending: Promise<ModelVersion[]> | null = null;

async function fetchModels(): Promise<ModelVersion[]> {
  if (cache) return cache;
  if (pending) return pending;
  pending = fetch(`${BACKEND}/models`)
    .then((r) => r.json())
    .then((d) => {
      cache = d.versions || [];
      return cache!;
    })
    .catch(() => {
      cache = [];
      return cache!;
    });
  const out = await pending;
  pending = null;
  return out;
}

export function useModels() {
  const [versions, setVersions] = useState<ModelVersion[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let live = true;
    fetchModels().then((v) => {
      if (live) {
        setVersions(v);
        setLoading(false);
      }
    });
    return () => { live = false; };
  }, []);

  return { versions, loading };
}
