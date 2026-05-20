"use client";

import { Upload, HelpCircle, Link as LinkIcon, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { IO_TYPE_META, IO_TYPES_ORDERED, type WorkflowIOType } from "./IOTypes";

export type { WorkflowIOType as WorkflowOutputType } from "./IOTypes";

export interface WorkflowOutput {
  id: string;
  name: string;
  type: WorkflowIOType;
  connectedNodeId?: string;
  connectedLabel?: string;
}

interface Props {
  x: number;
  y: number;
  outputs: WorkflowOutput[];
  onAddOutput: (name: string, type: WorkflowIOType) => void;
  onRemoveOutput: (id: string) => void;
  onRenameOutput?: (id: string, name: string) => void;
  onPortMouseUp?: (outputId: string) => void;
  onStartDrag?: (ev: React.MouseEvent) => void;
}

export function OutputsNode({
  x, y, outputs, onAddOutput, onRemoveOutput, onRenameOutput, onPortMouseUp, onStartDrag,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WorkflowIOType | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const empty = outputs.length === 0;

  const resetForm = () => { setAdding(false); setNewName(""); setNewType(""); };
  const submitForm = () => {
    if (!newName.trim() || !newType) return;
    onAddOutput(newName.trim(), newType as WorkflowIOType);
    resetForm();
  };
  const canSubmit = !!newName.trim() && !!newType;

  return (
    <div
      data-workflow-io
      className="absolute rounded-xl border border-border bg-surface-0 shadow-sm"
      style={{ left: x, top: y, width: 320 }}
    >
      <div
        className="flex items-center gap-2 rounded-t-xl px-3 py-2.5 border-b border-border cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => { e.stopPropagation(); onStartDrag?.(e); }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Upload className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-primary">Outputs</div>
          <div className="text-[10px] text-text-muted">Results your workflow returns</div>
        </div>
        <HelpCircle className="h-3.5 w-3.5 text-text-muted" />
      </div>

      <div className="p-2 space-y-1">
        {empty && (
          <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border bg-surface-1 px-3 py-4 text-center">
            <LinkIcon className="h-4 w-4 text-text-muted opacity-50" />
            <div className="text-xs font-semibold text-text-primary">No Connected Blocks</div>
            <div className="text-[10px] text-text-muted">
              Connect workflow blocks to this output block to define what your workflow returns.
            </div>
          </div>
        )}

        {outputs.map((output) => {
          const meta = IO_TYPE_META[output.type];
          const TypeIcon = meta.icon;
          const isEditing = editingId === output.id;
          return (
            <div
              key={output.id}
              className="group relative flex items-center gap-2 rounded-md bg-surface-1 px-2.5 py-1.5"
            >
              {/* Input port dot - left edge, colored by type */}
              <button
                className="absolute h-3.5 w-3.5 rounded-full border-2 border-surface-0 shadow-sm transition-transform hover:scale-125"
                style={{ left: -7, top: "50%", transform: "translateY(-50%)", background: meta.accent }}
                title={`in: ${output.name} (${meta.label.toLowerCase()})`}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onPortMouseUp?.(output.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />

              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{ background: `${meta.accent}18`, color: meta.accent }}
                title={meta.label}
              >
                <TypeIcon className="h-3 w-3" />
              </span>
              {isEditing ? (
                <input
                  autoFocus
                  value={output.name}
                  onChange={(e) => onRenameOutput?.(output.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                  className="flex-1 rounded bg-surface-0 px-1 font-mono text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              ) : (
                <button
                  className="flex-1 truncate text-left font-mono text-xs text-text-primary hover:text-accent"
                  onClick={() => onRenameOutput && setEditingId(output.id)}
                >
                  {output.name}
                </button>
              )}
              <span className="rounded-sm px-1 py-px text-[9px] font-semibold uppercase tracking-wider" style={{ background: `${meta.accent}18`, color: meta.accent }}>
                {meta.label}
              </span>
              {output.connectedLabel && (
                <span className="truncate text-[10px] text-text-muted">â† {output.connectedLabel}</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveOutput(output.id); }}
                className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Output
          </button>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submitForm(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="space-y-2 rounded-md border border-border bg-surface-0 p-2"
          >
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z0-9_]/g, "_"))}
                placeholder="output_name"
                className="w-full rounded border border-border bg-surface-0 px-2 py-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WorkflowIOType)}
                className="w-full rounded border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="" disabled>Select type...</option>
                {IO_TYPES_ORDERED.map((t) => (
                  <option key={t} value={t}>{IO_TYPE_META[t].label} - {IO_TYPE_META[t].description}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded border border-border bg-surface-0 px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "flex-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors",
                  canSubmit
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "cursor-not-allowed bg-surface-2 text-text-disabled",
                )}
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Canvas-local coordinates of an output port, given the current Outputs node position. */
export function outputPortPosition(nodeX: number, nodeY: number, outputIndex: number, hasOutputs: boolean): { x: number; y: number } {
  const ROW_H = 32;
  const HEADER_H = 42 + 8;
  const EMPTY_OFFSET = hasOutputs ? 0 : 90;
  return {
    x: nodeX,
    y: nodeY + HEADER_H + EMPTY_OFFSET + ROW_H * outputIndex + ROW_H / 2,
  };
}
