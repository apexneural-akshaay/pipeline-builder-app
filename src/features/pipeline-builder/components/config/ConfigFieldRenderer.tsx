"use client";

import { useMemo, useRef, useState } from "react";
import type { ConfigField } from "../../types/block.types";
import { useModels } from "../../lib/use-models";
import { useClasses } from "../../lib/use-classes";

interface Props {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  /** Full node config — needed by widgets whose options depend on other fields. */
  allValues?: Record<string, string>;
  /** For widgets that need to set multiple config keys at once. */
  onMultiChange?: (patch: Record<string, string>) => void;
}

const BACKEND_URL =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

export function ConfigFieldRenderer({ field, value, onChange, allValues, onMultiChange }: Props) {
  const common = "w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none";

  if (field.type === "video_source") {
    return <VideoSourceField value={value} onChange={onChange} placeholder={field.placeholder} />;
  }

  if (field.type === "class_picker") {
    // For the model block, task is set on this node. For the condition block
    // (which doesn't know upstream task), fall back to "detect" so we show COCO.
    return (
      <ClassPickerField
        value={value}
        onChange={onChange}
        task={allValues?.task || "detect"}
      />
    );
  }

  if (field.type === "model_picker") {
    return (
      <ModelPickerField
        allValues={allValues ?? {}}
        onMultiChange={onMultiChange ?? ((patch) => {
          // Fall back to single-key writes if the parent didn't pass onMultiChange
          for (const [k, v] of Object.entries(patch)) {
            if (k === field.key) onChange(v);
          }
        })}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={common}>
        <option value="">-- choose --</option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "toggle") {
    const on = value === "true";
    return (
      <button
        onClick={() => onChange(on ? "false" : "true")}
        className={`flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-surface-3"}`}
      >
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    );
  }

  if (field.type === "slider") {
    const numVal = value !== "" ? Number(value) : field.min ?? 0;
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={numVal}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="w-10 text-right font-mono text-[10px] text-text-muted">{Number.isNaN(numVal) ? field.placeholder : numVal}</span>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        className={common}
      />
    );
  }

  if (field.type === "password") {
    return (
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={common}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={`${common} resize-y font-mono text-[11px]`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={common}
    />
  );
}

function VideoSourceField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // Heuristic: anything starting with "rtsp" or "http" is RTSP mode; otherwise file mode.
  const initialMode = !value || /^(rtsp|http)/i.test(value) ? "rtsp" : "file";
  const [mode, setMode] = useState<"rtsp" | "file">(initialMode);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const inputClass =
    "w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none";

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BACKEND_URL}/uploads/video`, { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        setError(t || `HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as { path: string; filename: string };
      onChange(json.path);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-md bg-surface-1 p-0.5">
        <button
          type="button"
          onClick={() => setMode("rtsp")}
          className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            mode === "rtsp" ? "bg-surface-0 text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
          }`}
        >
          RTSP URL
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            mode === "file" ? "bg-surface-0 text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Video File
        </button>
      </div>

      {mode === "rtsp" ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "rtsp://..."}
          className={inputClass}
        />
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-1 px-3 text-xs font-medium text-text-primary hover:bg-surface-2 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : value ? "Replace file" : "Upload .mp4"}
            </button>
            {value && !uploading && (
              <span className="truncate text-[11px] text-text-muted" title={value}>
                {value.split(/[\\/]/).pop()}
              </span>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".mp4,.mov,.avi,.mkv,.webm,.m4v"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          {error && <div className="text-[11px] text-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

function ModelPickerField({
  allValues,
  onMultiChange,
}: {
  allValues: Record<string, string>;
  onMultiChange: (patch: Record<string, string>) => void;
}) {
  const { versions, loading } = useModels();
  const common =
    "w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-50";

  if (loading) {
    return <div className="text-[11px] text-text-muted">Loading available models...</div>;
  }
  if (versions.length === 0) {
    return (
      <div className="rounded border border-warning/40 bg-warning/5 p-2 text-[11px] text-warning">
        No models in backend/models/. Drop .pt files (e.g. yolo26n.pt) into that folder.
      </div>
    );
  }

  const selectedVersion = versions.find((v) => v.id === allValues.version) ?? versions[0];
  const selectedTask =
    selectedVersion.tasks.find((t) => t.id === allValues.task) ?? selectedVersion.tasks[0];
  const selectedSize =
    selectedTask?.sizes.find((s) => s.size === allValues.size) ?? selectedTask?.sizes[0];

  function pickVersion(versionId: string) {
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    const t = v.tasks[0];
    const s = t.sizes[0];
    onMultiChange({ version: v.id, task: t.id, size: s.size });
  }

  function pickTask(taskId: string) {
    const t = selectedVersion.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const s = t.sizes.find((x) => x.size === allValues.size) ?? t.sizes[0];
    onMultiChange({ task: t.id, size: s.size });
  }

  function pickSize(size: string) {
    onMultiChange({ size });
  }

  const trackingAllowed = ["detect", "segment", "pose"].includes(selectedTask?.id ?? "");
  const trackingOn = allValues.tracking === "true";

  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Version</div>
        <select value={selectedVersion.id} onChange={(e) => pickVersion(e.target.value)} className={common}>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Task</div>
        <select
          value={selectedTask?.id ?? ""}
          onChange={(e) => pickTask(e.target.value)}
          className={common}
          disabled={!selectedVersion.tasks.length}
        >
          {selectedVersion.tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Size</div>
        <select
          value={selectedSize?.size ?? ""}
          onChange={(e) => pickSize(e.target.value)}
          className={common}
          disabled={!selectedTask?.sizes.length}
        >
          {selectedTask?.sizes.map((s) => (
            <option key={s.size} value={s.size}>{s.size.toUpperCase()} - {s.filename}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between rounded border border-border bg-surface-1 px-2 py-1.5">
        <div>
          <div className="text-xs font-medium text-text-primary">Enable tracking</div>
          <div className="text-[10px] text-text-muted">
            {trackingAllowed ? "Assigns persistent IDs to each detection." : "Only available for detect, segment, pose."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => trackingAllowed && onMultiChange({ tracking: trackingOn ? "false" : "true" })}
          disabled={!trackingAllowed}
          className={`flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            trackingOn && trackingAllowed ? "bg-accent" : "bg-surface-3"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              trackingOn && trackingAllowed ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ClassPickerField({
  value,
  onChange,
  task,
}: {
  value: string;
  onChange: (v: string) => void;
  task?: string;
}) {
  const { data, loading } = useClasses(task);
  const [filter, setFilter] = useState("");

  // The form value is a comma-separated string. Normalize to a Set of trimmed names.
  const selected = useMemo(() => {
    const set = new Set<string>();
    for (const x of (value || "").split(",")) {
      const t = x.trim();
      if (t) set.add(t);
    }
    return set;
  }, [value]);

  function commit(next: Set<string>) {
    onChange(Array.from(next).join(","));
  }
  function toggle(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    commit(next);
  }
  function clearAll() {
    commit(new Set());
  }

  // Classify task: no compact list — keep a freeform text field
  if (data && data.classes.length === 0) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. golden retriever, tabby"
          className="w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        />
        <div className="text-[10px] text-text-muted">
          Classification uses 1000 ImageNet classes — too many to list. Type the exact class names, comma-separated.
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return <div className="text-[11px] text-text-muted">Loading class list...</div>;
  }

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? data.classes.filter((c) => c.toLowerCase().includes(q))
    : data.classes;

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-surface-1 p-1.5">
          {Array.from(selected).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggle(c)}
              className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/20"
              title="Click to remove"
            >
              {c}
              <span className="text-accent/60">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded px-1.5 py-0.5 text-[10px] text-text-muted hover:bg-surface-2 hover:text-text-primary"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-2 py-1.5 text-[11px] text-text-muted">
          No classes selected = keep <strong>all</strong> detections.
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={`Search ${data.source} classes...`}
        className="w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
      />

      {/* Options grid (scrollable) */}
      <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-surface-0 p-1">
        {filtered.length === 0 ? (
          <div className="px-2 py-2 text-center text-[11px] text-text-muted">No matches.</div>
        ) : (
          <div className="grid grid-cols-2 gap-0.5">
            {filtered.map((c) => {
              const on = selected.has(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggle(c)}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 text-left text-[11px] transition-colors ${
                    on
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                  }`}
                >
                  <span
                    className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border ${
                      on ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    {on && <span className="text-[9px] leading-none text-white">v</span>}
                  </span>
                  <span className="truncate">{c}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="text-[10px] text-text-muted">
        {data.source} - {data.classes.length} classes - {selected.size} selected
      </div>
    </div>
  );
}
