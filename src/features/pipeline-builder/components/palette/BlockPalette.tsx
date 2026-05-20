"use client";

import { ChevronRight, Plus, X, Sparkles } from "lucide-react";
import type { AnyAsset } from "../../types/asset.types";
import type { BlockDef } from "../../types/block.types";
import { ALL_PRIMITIVES } from "../../data/block-catalog";

interface Props {
  open: boolean;
  onToggle: () => void;
  onAddBlock: (type: string) => void;
  onAddAsset?: (asset: AnyAsset) => void;
}

export function BlockPalette({ open, onToggle, onAddBlock }: Props) {
  if (!open) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center gap-3 border-r border-border bg-surface-0 py-4">
        <button
          onClick={onToggle}
          className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md transition-all hover:scale-110 hover:bg-accent-hover"
          title="Add block"
          aria-label="Add block"
        >
          <Plus className="h-5 w-5" />
          <span className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface-0 px-2 py-1 text-[11px] font-medium text-text-secondary shadow-dropdown group-hover:block">
            Add block
          </span>
        </button>
        <div className="mt-1 h-px w-6 bg-border" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">add</span>
      </aside>
    );
  }

  return (
    <aside className="relative z-10 flex w-[300px] shrink-0 flex-col border-r border-border bg-surface-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Blocks</h2>
          <p className="text-[10px] text-text-muted">Drag or click to add</p>
        </div>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {ALL_PRIMITIVES.map((block) => (
            <BlockRow
              key={block.type}
              block={block}
              onClick={() => {
                onAddBlock(block.type);
                onToggle();
              }}
            />
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-1 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <Sparkles className="h-3 w-3" />
            Tip
          </div>
          <p className="text-[11px] leading-snug text-text-secondary">
            Build a pipeline: <strong className="text-text-primary">Input</strong> →{" "}
            <strong className="text-text-primary">Model</strong> →{" "}
            <strong className="text-text-primary">Condition</strong> →{" "}
            <strong className="text-text-primary">Event/Alert</strong>.
          </p>
        </div>
      </div>
    </aside>
  );
}

function BlockRow({ block, onClick }: { block: BlockDef; onClick: () => void }) {
  const Icon = block.icon;
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-lg border border-border bg-surface-1 p-2.5 text-left transition-all hover:-translate-y-px hover:border-accent/40 hover:bg-surface-0 hover:shadow-card"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-text-secondary transition-colors group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-text-primary">{block.label}</div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-muted">
          {block.description}
        </p>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
    </button>
  );
}
