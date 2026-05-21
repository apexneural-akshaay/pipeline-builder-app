"use client";

import { useCallback, useEffect, useState } from "react";

export type DownloadStatus =
  | "installed"
  | "downloadable"
  | "queued"
  | "downloading"
  | "done"
  | "error"
  | "unavailable";

export interface ModelSize {
  size: string;
  label: string;
  filename: string;
  available: boolean;
  downloadable: boolean;
  download_status: DownloadStatus;
  download_error?: string;
  input_size?: number;
  params_m?: number;
  flops_b?: number;
  map?: number;
  speed_cpu_ms?: number;
  speed_gpu_ms?: number;
  notes?: string;
}
export interface ModelTask {
  id: string;
  label: string;
  dataset: string;
  sizes: ModelSize[];
}
export interface ModelVersion {
  id: string;
  label: string;
  status?: string;
  license?: string;
  description?: string;
  nms_free?: boolean;
  tasks: ModelTask[];
}

const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

async function fetchModels(): Promise<ModelVersion[]> {
  try {
    const r = await fetch(`${BACKEND}/models`);
    const d = await r.json();
    return d.versions || [];
  } catch {
    return [];
  }
}

/**
 * Live model catalog. Re-fetches when refresh() is called — needed so the picker
 * picks up download_status transitions (downloading → done) without a full reload.
 */
export function useModels() {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const v = await fetchModels();
    setVersions(v);
    setLoading(false);
  }, []);

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

  return { versions, loading, refresh };
}
