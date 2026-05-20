"use client";

import { useEffect } from "react";
import type { PipelineEdge, PipelineNode } from "../types/block.types";

// Bump these whenever the canvas world geometry changes — old saved positions
// would otherwise leave restored nodes at off-screen world coords.
const KEY = "pipeline-builder/canvas/v2";
const RUN_KEY = "pipeline-builder/run/v2";

interface PersistedCanvas {
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export function loadCanvas(): PersistedCanvas | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCanvas(c: PersistedCanvas) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
}

export function clearCanvas() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

/** Use in a component: persists canvas state on every change. */
export function usePersistCanvas(name: string, nodes: PipelineNode[], edges: PipelineEdge[]) {
  useEffect(() => {
    saveCanvas({ name, nodes, edges });
  }, [name, nodes, edges]);
}

interface PersistedRun {
  runId: string | null;
  status: string;
  logs: Array<{ time: number; stream: string; line: string }>;
}

export function loadRun(): PersistedRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveRun(r: PersistedRun) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(RUN_KEY, JSON.stringify(r)); } catch {}
}

export function clearRun() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(RUN_KEY); } catch {}
}
