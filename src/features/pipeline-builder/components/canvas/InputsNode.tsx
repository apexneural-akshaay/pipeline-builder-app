"use client";

import { Download, HelpCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { IO_TYPE_META, IO_TYPES_ORDERED, type WorkflowIOType } from "./IOTypes";

export type { WorkflowIOType as WorkflowInputType } from "./IOTypes";

export interface WorkflowInput {
  id: string;
  name: string;
  type: WorkflowIOType;
  /** If the user uploaded a file or pasted a URL, we attach it here. */
  source?:
    | { kind: "file"; filename: string; size: number; mime: string; dataUrl?: string }
    | { kind: "url"; url: string };
}

interface Props {
  x: number;
  y: number;
  inputs: WorkflowInput[];
  /** name AND type are chosen in the inline form before creation */
  onAddInput: (name: string, type: WorkflowIOType) => void;
  onRemoveInput: (id: string) => void;
  onRenameInput?: (id: string, name: string) => void;
  onPortMouseDown?: (inputId: string, x: number, y: number) => void;
  onStartDrag?: (ev: React.MouseEvent) => void;
}

/** Each workflow input exposes an OUTPUT port on its right edge and has a
 *  type that governs which Media source the Run panel will expose. */
export function InputsNode({
  x, y, inputs, onAddInput, onRemoveInput, onRenameInput, onPortMouseDown, onStartDrag,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WorkflowIOType | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => { setAdding(false); setNewName(""); setNewType(""); };
  const submitForm = () => {
    if (!newName.trim() || !newType) return;
    onAddInput(newName.trim(), newType as WorkflowIOType);
    resetForm();
  };
  const canSubmit = !!newName.trim() && !!newType;

  return (
    <div
      data-workflow-io
      className="absolute rounded-xl border border-border bg-surface-0 shadow-sm"
      style={{ left: x, top: y, width: 300 }}
    >
      <div
        className="flex items-center gap-2 rounded-t-xl px-3 py-2.5 border-b border-border cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => { e.stopPropagation(); onStartDrag?.(e); }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Download className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-primary">Inputs</div>
          <div className="text-[10px] text-text-muted">Data your workflow needs to run</div>
        </div>
        <HelpCircle className="h-3.5 w-3.5 text-text-muted" />
      </div>

      <div className="p-2 space-y-1">
        {inputs.map((input) => {
          const meta = IO_TYPE_META[input.type];
          const TypeIcon = meta.icon;
          const isEditing = editingId === input.id;
          const source = input.source;
          const hasThumb = source?.kind === "file" && source.mime.startsWith("image/") && source.dataUrl;
          const sourceLabel = source?.kind === "file"
            ? source.filename
            : source?.kind === "url"
              ? source.url.replace(/^https?:\/\//, "")
              : null;
          return (
            <div
              key={input.id}
              className="group relative flex flex-col gap-1 rounded-md bg-surface-1 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
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
                    value={input.name}
                    onChange={(e) => onRenameInput?.(input.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                    className="flex-1 rounded bg-surface-0 px-1 font-mono text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                ) : (
                  <button
                    className="flex-1 truncate text-left font-mono text-xs text-text-primary hover:text-accent"
                    onClick={() => onRenameInput && setEditingId(input.id)}
                    title="Rename"
                  >
                    {input.name}
                  </button>
                )}
                <span className="rounded-sm px-1 py-px text-[9px] font-semibold uppercase tracking-wider" style={{ background: `${meta.accent}18`, color: meta.accent }}>
                  {meta.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveInput(input.id); }}
                  className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Attached file / URL */}
              {sourceLabel && (
                <div className="flex items-center gap-1.5 rounded bg-surface-0 px-1.5 py-1">
                  {hasThumb && source.kind === "file" ? (
                    <img
                      src={source.dataUrl}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">
                      {source?.kind === "file" ? "F" : "U"}
                    </span>
                  )}
                  <span className="truncate text-[10px] text-text-secondary" title={sourceLabel}>
                    {sourceLabel}
                  </span>
                </div>
              )}

              {/* Output port dot */}
              <button
                className="absolute h-3.5 w-3.5 rounded-full border-2 border-surface-0 shadow-sm transition-transform hover:scale-125"
                style={{
                  right: -7,
                  top: sourceLabel ? "20px" : "50%",
                  transform: "translateY(-50%)",
                  background: meta.accent,
                }}
                title={`out: ${input.name} (${meta.label.toLowerCase()})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (!onPortMouseDown) return;
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onPortMouseDown(input.id, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }}
              />
            </div>
          );
        })}

        {/* Add button OR inline form */}
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Input
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
                placeholder="input_name"
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

/** Canvas-local coordinates of an input port, given the current Inputs node position. */
export function inputPortPosition(nodeX: number, nodeY: number, inputIndex: number): { x: number; y: number } {
  const ROW_H = 32;
  const HEADER_H = 42 + 8;
  const NODE_W = 300;
  return {
    x: nodeX + NODE_W,
    y: nodeY + HEADER_H + ROW_H * inputIndex + ROW_H / 2,
  };
}
