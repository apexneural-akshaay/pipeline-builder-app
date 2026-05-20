"use client";

import { X, Brain, Target, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  defaultKind?: "model" | "task";
  onClose: () => void;
  onSave: (params: { kind: "model" | "task"; name: string; description: string; icon: string; taskType?: string }) => void;
}

export function SaveAsAssetDialog({ open, defaultKind = "model", onClose, onSave }: Props) {
  const [kind, setKind] = useState<"model" | "task">(defaultKind);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("ðŸ§ ");
  const [taskType, setTaskType] = useState("custom");

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      kind,
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || "*",
      taskType: kind === "task" ? taskType : undefined,
    });
    setName("");
    setDescription("");
    setIcon(kind === "task" ? "ðŸŽ¯" : "ðŸ§ ");
  };

  const KindIcon = kind === "model" ? Brain : Target;
  const accent = kind === "model" ? "#d946ef" : "#ec4899";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[16px] border border-border bg-surface-0 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative border-b border-border px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${accent}0d 0%, var(--surface-0) 100%)` }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 16px -4px ${accent}66` }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Save as Asset</h2>
                <p className="text-[11px] text-text-muted">
                  Turn your canvas into a reusable block in <span className="font-semibold">MY ASSETS</span>.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Kind selector */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Save as</label>
            <div className="grid grid-cols-2 gap-2">
              {(["model", "task"] as const).map((k) => {
                const KIcon = k === "model" ? Brain : Target;
                const c = k === "model" ? "#d946ef" : "#ec4899";
                const active = kind === k;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      setKind(k);
                      setIcon(k === "task" ? "ðŸŽ¯" : "ðŸ§ ");
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all",
                      active ? "border-transparent shadow-sm" : "border-border hover:border-accent/40 hover:bg-surface-2",
                    )}
                    style={active ? { background: `${c}10`, boxShadow: `0 0 0 2px ${c}40` } : undefined}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{
                        background: active ? c : `${c}20`,
                        color: active ? "#fff" : c,
                      }}
                    >
                      <KIcon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className={cn("text-xs font-semibold capitalize", active ? "" : "text-text-primary")} style={active ? { color: c } : undefined}>
                        {k}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {k === "model" ? "Neural network" : "Task pattern"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name + Icon */}
          <div className="grid grid-cols-[1fr_72px] gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === "model" ? "my-custom-yolov8" : "count_cars_at_gate"}
                className="w-full rounded-input border border-border bg-surface-0 px-2.5 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Icon</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                className="w-full rounded-input border border-border bg-surface-0 px-2 py-2 text-center text-lg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this do?"
              className="w-full resize-y rounded-input border border-border bg-surface-0 px-2.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Task type */}
          {kind === "task" && (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Task type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full rounded-input border border-border bg-surface-0 px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
              >
                {["detection", "classification", "segmentation", "pose", "ocr", "tracking", "counting", "anomaly", "custom"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          {name.trim() && (
            <div className="rounded-md border border-dashed border-border bg-surface-1 p-3">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Preview</div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    color: "#fff",
                  }}
                >
                  {icon || "*"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-text-primary">{name}</span>
                    <span className="rounded-sm bg-accent-muted px-1 py-px text-[8.5px] font-semibold uppercase tracking-wide text-accent">mine</span>
                  </div>
                  <div className="truncate text-[10px] text-text-muted">{description || "No description"}</div>
                </div>
                <KindIcon className="h-3 w-3 text-text-muted" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-1 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all",
              name.trim() ? "bg-accent hover:bg-accent-hover hover:shadow-card-hover" : "cursor-not-allowed bg-text-disabled",
            )}
          >
            Save {kind}
          </button>
        </div>
      </div>
    </div>
  );
}
