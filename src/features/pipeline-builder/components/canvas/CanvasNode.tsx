"use client";

import { X, Plus, Play, Database, Target as TargetIcon, Package, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlockDef, PipelineNode } from "../../types/block.types";
import { NODE_W, NODE_H } from "../../types/block.types";
import { catStyle } from "../../data/cat-styles";
import { findBlockDef } from "../../data/block-catalog";
import { useAssetsStore } from "../../stores/assets.store";

interface Props {
  node: PipelineNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (nodeId: string, node: PipelineNode, ev: React.MouseEvent) => void;
  onQuickAdd?: (nodeId: string) => void;
  onTestNode?: (nodeId: string) => void;
  onPortMouseDown: (nodeId: string, port: number, x: number, y: number) => void;
  onPortMouseUp: (nodeId: string, port: number) => void;
  /** Live activity from running pipeline. */
  activity?: { frames?: number; detections?: number; passed?: number; fired?: number };
  isActive?: boolean;
}

const ASSET_KIND_ICONS = {
  model: Package,
  task: TargetIcon,
  dataset: Database,
  metric: BarChart3,
} as const;

export function CanvasNode({
  node, selected, onSelect, onDelete, onDragStart, onQuickAdd, onTestNode, onPortMouseDown, onPortMouseUp,
  activity, isActive,
}: Props) {
  const def: BlockDef | undefined = findBlockDef(node.type);
  const style = catStyle(node.category);
  const isArchOrHead = node.category === "Architecture" || node.category === "Heads";
  const isAsset = !!node.assetRef;

  // Resolve asset if this is a composite node
  const getAsset = useAssetsStore((s) => s.getAsset);
  const asset = node.assetRef ? getAsset(node.assetRef.id) : undefined;

  // Determine actual input/output ports
  const inputs: Array<{ name: string; type: string }> = isAsset && asset
    ? asset.inputs
    : (def?.inputs ?? []).map((t) => ({ name: t, type: t }));
  const outputs: Array<{ name: string; type: string }> = isAsset && asset
    ? asset.outputs
    : (def?.outputs ?? []).map((t) => ({ name: t, type: t }));

  const Icon = isAsset ? ASSET_KIND_ICONS[node.assetRef!.kind] : def?.icon;

  // n8n-style monochrome: accent only on selected/active. Subtle asset hint kept minimal.
  // Note: keep style import so categories don't fully lose their identity if reintroduced.
  void style; void isArchOrHead;

  return (
    <div
      data-node
      className={cn(
        "group absolute select-none rounded-card border bg-surface-1 transition-all",
        "cursor-grab active:cursor-grabbing",
        selected
          ? "border-accent shadow-card-hover"
          : isActive
          ? "border-accent/50 hover:shadow-card-hover"
          : "border-border hover:border-border-emphasis hover:shadow-card-hover",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: NODE_H,
        boxShadow: selected
          ? `0 0 0 3px var(--accent-muted), 0 8px 24px -10px rgba(15,23,42,0.18)`
          : undefined,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        onDragStart(node.id, node, e);
      }}
    >
      {/* Thin accent stripe — only visible when selected/active for a clean monochrome look */}
      {(selected || isActive) && (
        <div className="absolute left-0 top-0 h-full w-[2px] rounded-l-card bg-accent" />
      )}

      {/* Top bar: category + run + delete */}
      <div className="flex items-center justify-between pl-2.5 pr-1.5 pt-1">
        <span className="truncate text-[8.5px] font-bold uppercase tracking-[0.08em] text-text-muted">
          {isAsset ? `${node.assetRef!.kind} asset` : node.category}
        </span>
        <div className="flex items-center gap-0.5">
          {onTestNode && (
            <button
              className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-accent/10 hover:text-accent group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onTestNode(node.id);
              }}
              title="Test this block"
            >
              <Play className="h-2.5 w-2.5" />
            </button>
          )}
          <button
            className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-error group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            title="Delete"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center gap-2.5 px-2.5 pt-0.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border transition-colors",
            selected || isActive
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-border bg-surface-2 text-text-secondary",
          )}
        >
          {Icon ? <Icon className="h-4 w-4" /> : <span className="text-sm">?</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold leading-tight text-text-primary">{node.label}</div>
          <div className="mt-0.5 truncate text-[10px] leading-tight text-text-muted">
            {isArchOrHead && node.channels
              ? `${node.channels}ch${node.outputShape ? `  -  ${node.outputShape}` : ""}`
              : isAsset
              ? `${inputs.length} in  -  ${outputs.length} out`
              : def?.description ?? ""}
          </div>
        </div>
      </div>

      {/* Input ports (stacked vertically on left) */}
      {inputs.map((port, i) => (
        <PortDot
          key={`in-${i}`}
          side="in"
          index={i}
          total={inputs.length}
          label={port.name}
          color="var(--border-emphasis)"
          accent="var(--accent)"
          onMouseUp={(e) => {
            e.stopPropagation();
            onPortMouseUp(node.id, i);
          }}
        />
      ))}

      {/* Output ports (stacked vertically on right) */}
      {outputs.map((port, i) => (
        <PortDot
          key={`out-${i}`}
          side="out"
          index={i}
          total={outputs.length}
          label={port.name}
          color={selected || isActive ? "var(--accent)" : "var(--text-muted)"}
          accent="var(--accent)"
          onMouseDown={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onPortMouseDown(node.id, i, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }}
        />
      ))}

      {/* Activity stats live inside the node bottom — no longer overlaps connections */}
      {activity && (
        <div
          className={cn(
            "absolute inset-x-2 bottom-1 flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold transition-colors",
            isActive
              ? "bg-accent/10 text-accent"
              : "bg-surface-2 text-text-muted",
          )}
        >
          {isActive && (
            <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          )}
          <span className="truncate">
            {[
              activity.frames != null ? `${activity.frames} fr` : null,
              activity.detections != null ? `${activity.detections} det` : null,
              activity.passed != null ? `${activity.passed} pass` : null,
              activity.fired != null ? `${activity.fired} fire` : null,
            ].filter(Boolean).join(" · ")}
          </span>
        </div>
      )}

      {/* Quick-add */}
      {onQuickAdd && outputs.length > 0 && (
        <button
          className="absolute -right-10 top-1/2 -translate-y-1/2 rounded-full bg-surface-0 p-1 text-text-muted opacity-0 shadow-card transition-all hover:scale-110 hover:text-accent group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(node.id);
          }}
          title="Add next block"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Port dot with hover label
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PortDotProps {
  side: "in" | "out";
  index: number;
  total: number;
  label: string;
  color: string;
  accent: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
}

function PortDot({ side, index, total, label, color, accent, onMouseDown, onMouseUp }: PortDotProps) {
  const yPercent = ((index + 1) / (total + 1)) * 100;
  const isIn = side === "in";

  return (
    <div
      className="group/port absolute z-10"
      style={{
        top: `${yPercent}%`,
        [isIn ? "left" : "right"]: "-7px",
        transform: "translateY(-50%)",
      }}
    >
      <button
        className={cn(
          "flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-surface-0 shadow-sm transition-all",
          "hover:scale-[1.4]",
        )}
        style={{ background: color }}
        title={`${isIn ? "in" : "out"}: ${label}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onMouseUp?.(e);
        }}
      >
        <span className="h-[5px] w-[5px] rounded-full bg-surface-0" />
      </button>
      {/* Label only on hover */}
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 whitespace-nowrap rounded px-1.5 py-[2px] text-[9px] font-mono font-semibold opacity-0 shadow-sm transition-opacity group-hover/port:opacity-100",
          isIn ? "right-[calc(100%+6px)]" : "left-[calc(100%+6px)]",
        )}
        style={{
          background: accent,
          color: "#fff",
          transform: "translateY(-50%)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
