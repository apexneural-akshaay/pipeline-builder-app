import type { PipelineEdge, PipelineNode } from "../types/block.types";

export interface ExportedPipelineNode {
  id: string;
  type: string;
  config: Record<string, any>;
}
export interface ExportedPipelineEdge {
  from: string;
  to: string;
}
export interface ExportedPipeline {
  schemaVersion: 1;
  name: string;
  nodes: ExportedPipelineNode[];
  edges: ExportedPipelineEdge[];
}

const COMMA_SEPARATED_KEYS = new Set(["classes"]);
const BOOLEAN_KEYS = new Set(["save_screenshot", "save_clip", "tracking"]);

function coerceConfig(raw: Record<string, string> | undefined): Record<string, any> {
  if (!raw) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === "" || v === undefined || v === null) continue;

    if (BOOLEAN_KEYS.has(k)) {
      out[k] = String(v) === "true";
      continue;
    }

    if (COMMA_SEPARATED_KEYS.has(k)) {
      out[k] = String(v).split(",").map((x) => x.trim()).filter(Boolean);
      continue;
    }

    if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) {
      out[k] = Number(v);
      continue;
    }

    out[k] = v;
  }
  return out;
}

export function serializePipeline(
  name: string,
  nodes: PipelineNode[],
  edges: PipelineEdge[],
): ExportedPipeline {
  // Exclude virtual UI-only nodes (the Inputs/Outputs cards live as separate state).
  const realNodes = nodes.filter((n) => !n.id.startsWith("io:"));

  return {
    schemaVersion: 1,
    name: name?.trim() || "untitled_pipeline",
    nodes: realNodes.map((n) => ({
      id: n.id,
      type: n.type,
      config: coerceConfig(n.config as any),
    })),
    edges: edges
      .filter((e) => !e.source.startsWith("io:") && !e.target.startsWith("io:"))
      .map((e) => ({ from: e.source, to: e.target })),
  };
}

export async function exportPipeline(
  backendUrl: string,
  pipeline: ExportedPipeline,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${backendUrl}/pipelines/compile/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
    });
    if (!res.ok) {
      const err = await res.text();
      let msg = err;
      try { msg = JSON.parse(err).message ?? err; } catch {}
      return { ok: false, error: msg || `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { code: string };
    return { ok: true, code: json.code };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Network error" };
  }
}

export function downloadAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/x-python" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
