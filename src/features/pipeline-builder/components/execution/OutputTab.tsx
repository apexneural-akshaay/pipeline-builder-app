"use client";

import type { PipelineNode } from "../../types/block.types";
import type { ExecLog } from "../../hooks/use-pipeline-execution";
import { findBlockDef } from "../../data/block-catalog";
import { catStyle } from "../../data/cat-styles";

interface Props {
  nodes: PipelineNode[];
  logs: ExecLog[];
}

export function OutputTab({ nodes, logs }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="text-xs text-text-muted">Add blocks to see their output.</div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-3">
      {nodes.map((n) => {
        const def = findBlockDef(n.type);
        const s = catStyle(n.category);
        const last = [...logs].reverse().find((l) => l.nodeId === n.id);
        const status = last?.level ?? "info";
        const dot = status === "error" ? "var(--error)" : status === "success" ? "var(--success)" : "var(--text-disabled)";
        return (
          <div
            key={n.id}
            className="group flex items-center gap-3 rounded-md border border-border bg-surface-0 px-3 py-2 transition-colors hover:border-accent/30"
          >
            <span
              className="h-2 w-2 rounded-full shadow-sm"
              style={{ background: dot, boxShadow: `0 0 6px ${dot}88` }}
            />
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold"
              style={{ background: `${s.iconBg}22`, color: s.border }}
            >
              {(def?.label ?? n.label)[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: s.border }}>
                  {n.category}
                </span>
                <span className="text-xs font-semibold text-text-primary">{n.label}</span>
              </div>
              <div className="truncate text-[11px] text-text-muted">
                {last?.message ?? "(not executed yet)"}
              </div>
            </div>
            {def && def.outputs.length > 0 && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-muted">
                {"->"} {def.outputs.join(", ")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
