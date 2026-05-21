"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfigField } from "../../types/block.types";
import { useModels, type ModelSize, type ModelTask, type ModelVersion } from "../../lib/use-models";
import { useClasses } from "../../lib/use-classes";
import { useDownloads } from "../../lib/use-downloads";

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
    // Prefer the resolved filename if upstream model_picker has set it — that
    // gives us the exact dataset the model was trained on. Fall back to task.
    return (
      <ClassPickerField
        value={value}
        onChange={onChange}
        task={allValues?.task || "detect"}
        filename={allValues?.filename}
      />
    );
  }

  if (field.type === "rule_builder") {
    // Class list priority:
    //   1. _upstream_classes — comma-sep list of classes the user picked in
    //      the model block (those are the ONLY classes that flow through).
    //   2. _upstream_filename — fall back to the model's full training-dataset
    //      class list if the user didn't restrict.
    const upstreamClassesRaw = allValues?._upstream_classes ?? "";
    const restrictedClasses = upstreamClassesRaw
      ? upstreamClassesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    return (
      <RuleBuilderField
        value={value}
        onChange={onChange}
        upstreamFilename={allValues?._upstream_filename || allValues?.filename}
        restrictedClasses={restrictedClasses}
      />
    );
  }

  if (field.type === "model_picker") {
    return (
      <ModelPickerField
        allValues={allValues ?? {}}
        onMultiChange={onMultiChange ?? ((patch) => {
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
  const { versions, loading, refresh } = useModels();
  const { jobs, start } = useDownloads(() => {
    // When any download finishes, re-pull /models so the picker flips
    // available: false → true.
    refresh();
  });

  const common =
    "w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-50";

  // ── Derive selection from current state. Resolve every step defensively so
  //    we can call hooks unconditionally before any early return. ──
  const selectedVersion: ModelVersion | undefined =
    versions.find((v) => v.id === allValues.version) ?? versions[0];
  const selectedTask: ModelTask | undefined =
    selectedVersion?.tasks.find((t) => t.id === allValues.task) ?? selectedVersion?.tasks[0];
  const selectedSize: ModelSize | undefined =
    selectedTask?.sizes.find((s) => s.size === allValues.size) ?? selectedTask?.sizes[0];

  // Keep the form value (filename) in sync with the picker selection. This lets
  // downstream widgets (class_picker) target the right dataset. Hook is declared
  // unconditionally — any early return below is allowed because all hooks run first.
  useEffect(() => {
    if (selectedSize && allValues.filename !== selectedSize.filename) {
      onMultiChange({ filename: selectedSize.filename });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize?.filename]);

  if (loading) {
    return <div className="text-[11px] text-text-muted">Loading models...</div>;
  }
  if (versions.length === 0 || !selectedVersion || !selectedTask) {
    return (
      <div className="rounded border border-warning/40 bg-warning/5 p-2 text-[11px] text-warning">
        Backend returned no models. Is the backend running on port 4001?
      </div>
    );
  }

  function pickVersion(versionId: string) {
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    const t = v.tasks[0];
    const s = t.sizes[0];
    onMultiChange({ version: v.id, task: t.id, size: s.size, filename: s.filename });
  }

  function pickTask(taskId: string) {
    const t = selectedVersion.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const s = t.sizes.find((x) => x.size === allValues.size) ?? t.sizes[0];
    onMultiChange({ task: t.id, size: s.size, filename: s.filename });
  }

  function pickSize(size: string) {
    const s = selectedTask.sizes.find((x) => x.size === size);
    if (!s) return;
    onMultiChange({ size: s.size, filename: s.filename });
  }

  const trackingAllowed = ["detect", "segment", "pose", "obb"].includes(selectedTask?.id ?? "");
  const trackingOn = allValues.tracking === "true";

  // Override status with any live job we know about (SSE stream).
  const liveJob = selectedSize ? jobs[selectedSize.filename] : undefined;
  const liveStatus = liveJob?.status ?? selectedSize?.download_status ?? "unavailable";
  const isDownloading = liveStatus === "queued" || liveStatus === "downloading";
  const isInstalled = liveStatus === "installed" || liveStatus === "done" || selectedSize?.available;

  return (
    <div className="space-y-2">
      {/* Model family */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Model</div>
        <select value={selectedVersion.id} onChange={(e) => pickVersion(e.target.value)} className={common}>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}{v.status && v.status !== "current" ? ` (${v.status})` : ""}{v.nms_free ? " · NMS-free" : ""}
            </option>
          ))}
        </select>
        {selectedVersion.description && (
          <div className="mt-1 text-[10px] leading-tight text-text-muted">{selectedVersion.description}</div>
        )}
      </div>

      {/* Task — only ones this family supports */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Task</div>
        <select
          value={selectedTask?.id ?? ""}
          onChange={(e) => pickTask(e.target.value)}
          className={common}
          disabled={!selectedVersion.tasks.length}
        >
          {selectedVersion.tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size — only ones valid for this (model, task) */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Size</div>
        <select
          value={selectedSize?.size ?? ""}
          onChange={(e) => pickSize(e.target.value)}
          className={common}
          disabled={!selectedTask?.sizes.length}
        >
          {selectedTask?.sizes.map((s) => (
            <option key={s.size} value={s.size}>
              {s.label} · {s.filename}{s.available ? " ✓" : ""}
            </option>
          ))}
        </select>

        {selectedSize && (
          <VariantDetail
            variant={selectedSize}
            status={liveStatus}
            error={liveJob?.error}
            onDownload={() => start(selectedSize.filename)}
          />
        )}
      </div>

      {/* Tracking toggle — gated on the task supporting it */}
      <div className="flex items-center justify-between rounded border border-border bg-surface-1 px-2 py-1.5">
        <div>
          <div className="text-xs font-medium text-text-primary">Enable tracking</div>
          <div className="text-[10px] text-text-muted">
            {trackingAllowed ? "Assigns persistent IDs to each detection." : `Not available for ${selectedTask?.label ?? "this task"}.`}
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

/** Compact info panel showing params/FLOPs/mAP + install/download state. */
function VariantDetail({
  variant,
  status,
  error,
  onDownload,
}: {
  variant: ModelSize;
  status: string;
  error?: string;
  onDownload: () => void;
}) {
  const facts: string[] = [];
  if (variant.params_m != null) facts.push(`${variant.params_m}M params`);
  if (variant.flops_b != null) facts.push(`${variant.flops_b} GFLOPs`);
  if (variant.map != null) facts.push(`mAP ${variant.map}`);
  if (variant.input_size != null) facts.push(`@ ${variant.input_size}`);

  let statusEl: React.ReactNode;
  if (status === "installed" || status === "done" || variant.available) {
    statusEl = <span className="text-success">✓ Installed</span>;
  } else if (status === "downloading" || status === "queued") {
    statusEl = <span className="text-accent">Downloading…</span>;
  } else if (status === "error") {
    statusEl = (
      <span className="text-error" title={error}>
        Download failed
      </span>
    );
  } else if (variant.downloadable) {
    statusEl = <span className="text-text-muted">Not installed</span>;
  } else {
    statusEl = <span className="text-text-muted">Unavailable</span>;
  }

  const showDownloadButton =
    !variant.available &&
    variant.downloadable &&
    status !== "downloading" &&
    status !== "queued" &&
    status !== "done";

  return (
    <div className="mt-1.5 rounded border border-border bg-surface-1 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-text-muted">{facts.join(" · ") || "—"}</div>
        <div className="text-[10px] font-medium">{statusEl}</div>
      </div>
      {showDownloadButton && (
        <button
          type="button"
          onClick={onDownload}
          className="mt-1 w-full rounded bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/20"
        >
          Download {variant.filename}
        </button>
      )}
      {status === "error" && error && (
        <div className="mt-1 break-all text-[10px] text-error">{error}</div>
      )}
      {variant.notes && (
        <div className="mt-1 text-[10px] text-text-muted">{variant.notes}</div>
      )}
    </div>
  );
}

function ClassPickerField({
  value,
  onChange,
  task,
  filename,
}: {
  value: string;
  onChange: (v: string) => void;
  task?: string;
  filename?: string;
}) {
  // Filename takes priority — gives the exact dataset for the chosen model.
  const { data, loading } = useClasses(filename ? { filename } : { task });
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

  if (loading || !data) {
    return <div className="text-[11px] text-text-muted">Loading class list...</div>;
  }
  if (data.classes.length === 0) {
    // True freeform fallback — only happens if a future dataset has no list yet.
    return (
      <div className="rounded border border-warning/40 bg-warning/5 p-2 text-[11px] text-warning">
        Class list unavailable. Type names comma-separated.
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="class1, class2"
          className="mt-1 w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? data.classes.filter((c) => c.toLowerCase().includes(q))
    : data.classes;

  // Big lists (ImageNet) — cap the rendered slice for perf.
  const RENDER_CAP = 200;
  const renderList = filtered.slice(0, RENDER_CAP);
  const cappedHint = filtered.length > RENDER_CAP
    ? `Showing first ${RENDER_CAP} of ${filtered.length} matches — type to narrow.`
    : null;

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
        placeholder="Search classes..."
        className="w-full rounded-input border border-border bg-surface-0 px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
      />

      {/* Options grid (scrollable) */}
      <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-surface-0 p-1">
        {renderList.length === 0 ? (
          <div className="px-2 py-2 text-center text-[11px] text-text-muted">No matches.</div>
        ) : (
          <div className="grid grid-cols-2 gap-0.5">
            {renderList.map((c) => {
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
        {data.classes.length} classes · {selected.size} selected
        {cappedHint && ` · ${cappedHint}`}
      </div>
    </div>
  );
}

// ─── Rule builder for the Condition block ───────────────────────────────────

type RuleType = "count" | "any_class" | "all_classes" | "min_confidence" | "max_count";
type CompOp = ">" | ">=" | "<" | "<=" | "=";

interface Rule {
  type: RuleType;
  class?: string;
  classes?: string[];
  op?: CompOp;
  value?: number;
}

interface RuleSet {
  combinator: "AND" | "OR";
  rules: Rule[];
}

const DEFAULT_RULES: RuleSet = { combinator: "AND", rules: [] };

const RULE_LABELS: Record<RuleType, string> = {
  count: "Count of class …",
  any_class: "Any of these classes is present",
  all_classes: "All of these classes are present",
  min_confidence: "At least one detection with confidence ≥",
  max_count: "Count of class … ≤",
};

const COMP_OPS: CompOp[] = [">", ">=", "<", "<=", "="];

function parseRules(s: string | undefined): RuleSet {
  if (!s) return DEFAULT_RULES;
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") {
      return {
        combinator: parsed.combinator === "OR" ? "OR" : "AND",
        rules: Array.isArray(parsed.rules) ? parsed.rules : [],
      };
    }
  } catch {}
  return DEFAULT_RULES;
}

function RuleBuilderField({
  value,
  onChange,
  upstreamFilename,
  restrictedClasses,
}: {
  value: string;
  onChange: (v: string) => void;
  upstreamFilename?: string;
  /** If the upstream model block already restricted to N classes, ONLY those
   *  classes will flow downstream — so we should only show those in dropdowns. */
  restrictedClasses?: string[];
}) {
  // Load the class list of the upstream model so the user can pick from real names.
  // Falls back to COCO detect classes when we don't know the exact filename yet.
  const { data: classData } = useClasses(upstreamFilename ? { filename: upstreamFilename } : { task: "detect" });
  const fullModelClasses = classData?.classes ?? [];
  // If the user picked specific classes upstream, use those. Otherwise show full list.
  const availableClasses = restrictedClasses && restrictedClasses.length > 0
    ? restrictedClasses
    : fullModelClasses;

  const rs = useMemo(() => parseRules(value), [value]);

  function commit(next: RuleSet) {
    onChange(JSON.stringify(next));
  }

  function addRule(type: RuleType) {
    const newRule: Rule =
      type === "count"          ? { type, class: "*", op: ">", value: 0 } :
      type === "max_count"      ? { type, class: "*", value: 10 } :
      type === "min_confidence" ? { type, value: 0.7 } :
      /* any_class / all_classes */ { type, classes: [] };
    commit({ ...rs, rules: [...rs.rules, newRule] });
  }

  function updateRule(idx: number, patch: Partial<Rule>) {
    const next = [...rs.rules];
    next[idx] = { ...next[idx], ...patch };
    commit({ ...rs, rules: next });
  }

  function removeRule(idx: number) {
    commit({ ...rs, rules: rs.rules.filter((_, i) => i !== idx) });
  }

  function setCombinator(c: "AND" | "OR") {
    commit({ ...rs, combinator: c });
  }

  const inputClass = "rounded border border-border bg-surface-0 px-2 py-1 text-[11px] text-text-primary focus:border-accent focus:outline-none";

  return (
    <div className="space-y-2">
      {rs.rules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-2 py-2 text-[11px] text-text-muted">
          No rules — event fires whenever the model produces <strong>any</strong> detection.
        </div>
      ) : (
        <>
          {/* AND/OR combinator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Combine with</span>
            <div className="flex gap-0.5 rounded-md bg-surface-1 p-0.5">
              {(["AND", "OR"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCombinator(c)}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                    rs.combinator === c
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-surface-2"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-1.5">
            {rs.rules.map((rule, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-1 p-2">
                <span className="text-[10px] font-medium text-text-muted">#{i + 1}</span>

                {rule.type === "count" && (
                  <>
                    <span className="text-[11px] text-text-secondary">count of</span>
                    <ClassDropdown
                      value={rule.class || "*"}
                      onChange={(v) => updateRule(i, { class: v })}
                      classes={availableClasses}
                      allowAny
                    />
                    <select
                      value={rule.op || ">"}
                      onChange={(e) => updateRule(i, { op: e.target.value as CompOp })}
                      className={inputClass}
                    >
                      {COMP_OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input
                      type="number"
                      value={rule.value ?? 0}
                      onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                      className={`${inputClass} w-16`}
                    />
                  </>
                )}

                {rule.type === "max_count" && (
                  <>
                    <span className="text-[11px] text-text-secondary">count of</span>
                    <ClassDropdown
                      value={rule.class || "*"}
                      onChange={(v) => updateRule(i, { class: v })}
                      classes={availableClasses}
                      allowAny
                    />
                    <span className="text-[11px] text-text-secondary">≤</span>
                    <input
                      type="number"
                      value={rule.value ?? 0}
                      onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                      className={`${inputClass} w-16`}
                    />
                  </>
                )}

                {(rule.type === "any_class" || rule.type === "all_classes") && (
                  <>
                    <span className="text-[11px] text-text-secondary">
                      {rule.type === "any_class" ? "any of" : "all of"}:
                    </span>
                    <MultiClassChips
                      values={rule.classes || []}
                      onChange={(cs) => updateRule(i, { classes: cs })}
                      available={availableClasses}
                    />
                  </>
                )}

                {rule.type === "min_confidence" && (
                  <>
                    <span className="text-[11px] text-text-secondary">confidence ≥</span>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rule.value ?? 0.7}
                      onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                      className={`${inputClass} w-20`}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  className="ml-auto rounded px-1.5 py-0.5 text-[11px] text-text-muted hover:bg-error/10 hover:text-error"
                  title="Remove rule"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add rule menu */}
      <div className="flex flex-wrap gap-1">
        {(Object.keys(RULE_LABELS) as RuleType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => addRule(t)}
            className="rounded-md border border-border bg-surface-0 px-2 py-1 text-[10px] font-medium text-text-secondary hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
          >
            + {RULE_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClassDropdown({
  value,
  onChange,
  classes,
  allowAny,
}: {
  value: string;
  onChange: (v: string) => void;
  classes: string[];
  allowAny?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border bg-surface-0 px-2 py-1 text-[11px] text-text-primary focus:border-accent focus:outline-none"
    >
      {allowAny && <option value="*">any class</option>}
      {classes.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function MultiClassChips({
  values,
  onChange,
  available,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  available: string[];
}) {
  const [adding, setAdding] = useState(false);

  function add(c: string) {
    if (!c) return;
    if (!values.includes(c)) onChange([...values, c]);
    setAdding(false);
  }
  function remove(c: string) {
    onChange(values.filter((v) => v !== c));
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.map((c) => (
        <span
          key={c}
          className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
        >
          {c}
          <button
            type="button"
            onClick={() => remove(c)}
            className="text-accent/60 hover:text-accent"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <select
          autoFocus
          value=""
          onChange={(e) => add(e.target.value)}
          onBlur={() => setAdding(false)}
          className="rounded border border-border bg-surface-0 px-1.5 py-0.5 text-[10px] text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">pick…</option>
          {available.filter((c) => !values.includes(c)).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-muted hover:border-accent/40 hover:text-accent"
        >
          + add
        </button>
      )}
    </div>
  );
}
