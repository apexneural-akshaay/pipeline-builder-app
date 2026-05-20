"use client";

import { HelpCircle } from "lucide-react";
import type { PipelineEdge, PipelineNode } from "../../types/block.types";
import { findBlockDef } from "../../data/block-catalog";
import { useAssetsStore } from "../../stores/assets.store";

interface Props {
  node: PipelineNode;
  edges: PipelineEdge[];
}

/** Ghost "Connect an Input" card shown to the LEFT of the selected expanded block
 *  when that block has at least one unconnected input. */
export function ConnectInputCard({ node, edges }: Props) {
  const def = findBlockDef(node.type);
  const getAsset = useAssetsStore((s) => s.getAsset);
  const asset = node.assetRef ? getAsset(node.assetRef.id) : undefined;
  const inputs = asset ? asset.inputs : (def?.inputs ?? []).map((t) => ({ name: t, type: t }));

  if (inputs.length === 0) return null;

  // Check if any input port has no incoming edge
  const hasUnconnected = inputs.some((_, i) => !edges.some((e) => e.target === node.id && (e.targetPort ?? 0) === i));
  if (!hasUnconnected) return null;

  return (
    <div
      className="absolute rounded-xl border border-dashed border-border bg-surface-0/90 px-4 py-5 text-center shadow-sm backdrop-blur-sm"
      style={{
        left: node.x - 240,
        top: node.y + 40,
        width: 220,
      }}
    >
      <div className="text-sm font-semibold text-text-primary">Connect an Input</div>
      <div className="mt-1 text-[11px] leading-snug text-text-muted">
        Drag output from other blocks to use them here.
      </div>
    </div>
  );
}

/** Ghost "N Output" card shown to the RIGHT of the selected expanded block. */
export function OutputSummaryCard({ node }: { node: PipelineNode }) {
  const def = findBlockDef(node.type);
  const getAsset = useAssetsStore((s) => s.getAsset);
  const asset = node.assetRef ? getAsset(node.assetRef.id) : undefined;
  const outputs = asset ? asset.outputs : (def?.outputs ?? []).map((t) => ({ name: t, type: t }));

  if (outputs.length === 0) return null;

  return (
    <div
      className="absolute rounded-xl border border-border bg-surface-0 shadow-sm"
      style={{
        left: node.x + 380,
        top: node.y + 30,
        width: 180,
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-text-primary">
          {outputs.length} Output{outputs.length > 1 ? "s" : ""}
        </span>
        <HelpCircle className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <div className="space-y-1 p-2">
        {outputs.map((out) => (
          <div key={out.name} className="flex items-center gap-1.5 rounded bg-surface-1 px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="truncate text-[11px] font-mono text-accent">{out.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
