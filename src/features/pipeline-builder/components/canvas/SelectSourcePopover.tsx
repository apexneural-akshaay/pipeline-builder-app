"use client";

import { useEffect, useRef } from "react";
import { Download, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PipelineNode } from "../../types/block.types";
import { findBlockDef } from "../../data/block-catalog";
import { catStyle } from "../../data/cat-styles";
import { useAssetsStore } from "../../stores/assets.store";
import { IO_TYPE_META, type WorkflowIOType } from "./IOTypes";
import type { WorkflowInput } from "./InputsNode";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Expected port type name (e.g. "frames", "detections"). Used to rank compatible sources. */
  expected: string;
  workflowInputs: WorkflowInput[];
  allNodes: PipelineNode[];
  /** The node this picker belongs to - its own outputs aren't offered as sources. */
  currentNodeId: string;
  onSelect: (
    source:
      | { kind: "workflow-input"; inputId: string }
      | { kind: "node-output"; nodeId: string; portIndex: number }
  ) => void;
}

/** Maps a workflow input type to the port types it can satisfy. */
const IO_TYPE_COMPAT: Record<WorkflowIOType, string[]> = {
  image:   ["image", "frames", "input"],
  video:   ["frames", "input"],
  stream:  ["frames", "input"],
  number:  ["value", "input"],
  string:  ["text", "input"],
  boolean: ["flag", "input"],
};

function isCompatible(expected: string, produced: string): boolean {
  if (!expected || expected === "input") return true;
  if (expected === produced) return true;
  // Common aliases
  if (expected === "image" && (produced === "frames" || produced === "annotated")) return true;
  if (expected === "frames" && (produced === "image" || produced === "annotated")) return true;
  return false;
}

export function SelectSourcePopover({
  open, onClose, expected, workflowInputs, allNodes, currentNodeId, onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const getAsset = useAssetsStore((s) => s.getAsset);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    const id = setTimeout(() => document.addEventListener("mousedown", handle), 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handle); };
  }, [open, onClose]);

  if (!open) return null;

  // Helper: is this workflow input type compatible with the expected port?
  const isInputCompat = (wi: WorkflowInput) => {
    const compats = IO_TYPE_COMPAT[wi.type] ?? [];
    return !expected || compats.includes(expected);
  };

  // ALL workflow inputs are shown - compatible ones first, incompatible dimmed
  const allInputsSorted = [...workflowInputs].sort((a, b) => {
    const ac = isInputCompat(a) ? 0 : 1;
    const bc = isInputCompat(b) ? 0 : 1;
    return ac - bc;
  });

  // ALL block outputs from other nodes are shown - compatible ones first
  type NodeOut = { node: PipelineNode; portIndex: number; portName: string; compat: boolean };
  const allOutputs: NodeOut[] = [];
  for (const node of allNodes) {
    if (node.id === currentNodeId) continue;
    const def = findBlockDef(node.type);
    const asset = node.assetRef ? getAsset(node.assetRef.id) : undefined;
    const outs = asset ? asset.outputs.map((p) => p.name) : def?.outputs ?? [];
    outs.forEach((out, i) => {
      allOutputs.push({ node, portIndex: i, portName: out, compat: isCompatible(expected, out) });
    });
  }
  allOutputs.sort((a, b) => (a.compat === b.compat ? 0 : a.compat ? -1 : 1));

  const nothingEligible = allInputsSorted.length === 0 && allOutputs.length === 0;

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-surface-0 shadow-modal"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <button
          onClick={onClose}
          className="rounded p-0.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Select source</div>
          <div className="text-[11px] text-text-secondary">
            {workflowInputs.length + allOutputs.length === 0 ? (
              <>No sources yet - add one on the <span className="font-semibold text-text-primary">Inputs</span> card.</>
            ) : workflowInputs.length + allOutputs.length === 1 ? (
              <>1 source available.</>
            ) : (
              <>
                {workflowInputs.length} input{workflowInputs.length === 1 ? "" : "s"}  - {" "}
                {allOutputs.length} block output{allOutputs.length === 1 ? "" : "s"} - pick one.
              </>
            )}
            {expected && (
              <>
                {" "}<span className="text-text-muted">Expecting</span>{" "}
                <span className="font-mono font-semibold text-text-primary">{expected}</span>.
              </>
            )}
          </div>
        </div>
      </div>

      {nothingEligible && (
        <div className="px-4 py-8 text-center">
          <div className="text-xs text-text-muted">No compatible sources yet.</div>
          <div className="mt-1 text-[10px] text-text-muted">
            Add a workflow input on the <span className="font-semibold text-text-secondary">Inputs</span> card,
            or add another block that produces this type.
          </div>
          <div className="mt-2 text-[10px] text-text-disabled">
            At run time you can attach files via the <span className="font-semibold text-text-secondary">Run</span> panel.
          </div>
        </div>
      )}

      {/* Workflow Inputs section - shows ALL inputs, compatible first */}
      {allInputsSorted.length > 0 && (
        <div className="py-1">
          <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
            <Download className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Workflow Inputs ({allInputsSorted.length})
            </span>
          </div>
          {allInputsSorted.map((wi) => {
            const meta = IO_TYPE_META[wi.type];
            const Icon = meta.icon;
            const compat = isInputCompat(wi);
            return (
              <button
                key={wi.id}
                onClick={() => onSelect({ kind: "workflow-input", inputId: wi.id })}
                className={cn(
                  "group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-2",
                  !compat && "opacity-70",
                )}
                title={compat ? `Compatible with ${expected}` : `Type mismatch - expects ${expected}, got ${meta.label.toLowerCase()}`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                  style={{ background: `${meta.accent}18`, color: meta.accent }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs text-text-primary">{wi.name}</div>
                  <div className="truncate text-[10px] text-text-muted">
                    Workflow input  -  <span className="font-mono">{wi.type}</span>
                  </div>
                </div>
                {compat ? (
                  <span className="flex items-center gap-0.5 rounded-sm bg-success/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-success">
                    <Check className="h-2.5 w-2.5" /> Match
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 rounded-sm bg-warning/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-warning">
                    <AlertCircle className="h-2.5 w-2.5" /> {meta.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Block Outputs section - shows ALL outputs, compatible first */}
      {allOutputs.length > 0 && (
        <div className={cn("py-1", allInputsSorted.length > 0 && "border-t border-border")}>
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Block Outputs ({allOutputs.length})
          </div>
          {allOutputs.map(({ node, portIndex, portName, compat }) => {
            const style = catStyle(node.category);
            return (
              <button
                key={`${node.id}-${portIndex}`}
                onClick={() => onSelect({ kind: "node-output", nodeId: node.id, portIndex })}
                className={cn(
                  "group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-2",
                  !compat && "opacity-70",
                )}
                title={compat ? `Compatible with ${expected}` : `Type mismatch - expects ${expected}, got ${portName}`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                  style={{ background: `${style.iconBg}`, color: style.iconColor }}
                >
                  {node.label[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-text-primary">{node.label}</div>
                  <div className="truncate text-[10px] text-text-muted">
                    <span className="font-mono">{portName}</span>
                    <span className="ml-1 text-text-disabled"> -  {String(node.category).toLowerCase()}</span>
                  </div>
                </div>
                {compat ? (
                  <span className="flex items-center gap-0.5 rounded-sm bg-success/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-success">
                    <Check className="h-2.5 w-2.5" /> Match
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 rounded-sm bg-warning/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-warning">
                    <AlertCircle className="h-2.5 w-2.5" /> Mismatch
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
