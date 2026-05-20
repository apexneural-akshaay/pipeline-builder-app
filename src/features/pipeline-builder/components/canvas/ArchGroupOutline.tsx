"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { PipelineNode, PresetGroup } from "../../types/block.types";
import { NODE_W, NODE_H } from "../../types/block.types";

interface Props {
  group: PresetGroup;
  nodes: PipelineNode[];
  onToggleCollapse?: (id: string) => void;
}

export function ArchGroupOutline({ group, nodes, onToggleCollapse }: Props) {
  const members = nodes.filter((n) => group.nodeIds.includes(n.id));
  if (members.length === 0) return null;

  const pad = 16;
  const minX = Math.min(...members.map((n) => n.x)) - pad;
  const maxX = Math.max(...members.map((n) => n.x + NODE_W)) + pad;
  const minY = Math.min(...members.map((n) => n.y)) - pad - 14;
  const maxY = Math.max(...members.map((n) => n.y + NODE_H)) + pad;

  return (
    <div
      className="pointer-events-none absolute rounded-card border-2 border-dashed"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        borderColor: "#6366f1",
        background: "rgba(99, 102, 241, 0.04)",
      }}
    >
      <div
        className="pointer-events-auto absolute left-2 top-1 flex items-center gap-1 rounded-badge bg-surface-0 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary shadow-card"
        style={{ transform: "translateY(-55%)" }}
      >
        {onToggleCollapse && (
          <button onClick={() => onToggleCollapse(group.id)} className="text-text-muted hover:text-text-primary">
            {group.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
        <span className="font-semibold" style={{ color: "#6366f1" }}>
          {group.presetName}
        </span>
        <span className="text-text-muted"> -  {members.length} layers</span>
      </div>
    </div>
  );
}
