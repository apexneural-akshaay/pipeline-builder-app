"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Sparkles, Upload, Plus, ArrowRight, Pencil, Trash2, Check,
  Wand2, Play, TrendingUp, Workflow, Download,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useAssetsStore } from "../../stores/assets.store";
import type { ModelAsset } from "../../types/asset.types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after the user finishes the wizard - returns the created Model asset. */
  onComplete?: (asset: ModelAsset) => void;
}

type Step = "build" | "review" | "use";

interface UploadedFile {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  mime: string;
}

interface DetectedObject {
  id: string;
  label: string;
  found: boolean;
  count: number;
  color: string;
}

const SUGGESTION_SEEDS = ["person", "car", "helmet", "vest", "forklift", "fire", "smoke", "plate"];
const OBJECT_COLORS = ["#2563eb", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#eab308", "#0891b2"];

export function RapidBuilderDialog({ open, onClose, onComplete }: Props) {
  const addAsset = useAssetsStore((s) => s.addAsset);

  const [step, setStep] = useState<Step>("build");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [prompt, setPrompt] = useState("");
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [confidence, setConfidence] = useState(0.5);
  const [isSearching, setIsSearching] = useState(false);
  const [modelName, setModelName] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => SUGGESTION_SEEDS.filter((s) => !prompt.toLowerCase().includes(s)).slice(0, 4),
    [prompt],
  );

  const canFind = prompt.trim().length > 0 && files.length > 0;

  if (!open) return null;

  const reset = () => {
    setStep("build"); setFiles([]); setPrompt(""); setObjects([]);
    setConfidence(0.5); setIsSearching(false); setModelName("");
  };
  const close = () => { reset(); onClose(); };

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    const incoming: UploadedFile[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
        r.readAsDataURL(file);
      });
      incoming.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        dataUrl,
        size: file.size,
        mime: file.type,
      });
    }
    setFiles((prev) => [...prev, ...incoming]);
  };

  const handleFindObjects = () => {
    if (!canFind) return;
    setIsSearching(true);
    const words = prompt.split(/[,\s]+/).map((w) => w.trim()).filter(Boolean);
    setTimeout(() => {
      const results: DetectedObject[] = words.map((w, i) => ({
        id: `obj-${i}`,
        label: w,
        found: Math.random() > 0.2,
        count: Math.floor(Math.random() * 6) + 1,
        color: OBJECT_COLORS[i % OBJECT_COLORS.length],
      }));
      setObjects(results);
      setIsSearching(false);
      setStep("review");
    }, 1400);
  };

  const handleCreateModel = () => {
    const name = modelName.trim() || `Custom ${prompt.split(/[,\s]+/)[0] || "detector"}`;
    const found = objects.filter((o) => o.found).map((o) => o.label);
    const asset: ModelAsset = {
      id: `model-rapid-${Date.now()}`,
      kind: "model",
      name,
      description: `Custom detector trained on ${files.length} image${files.length === 1 ? "" : "s"} for: ${found.join(", ") || prompt}`,
      icon: "âœ¨",
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      inputs: [{ name: "frames", type: "frames" }],
      outputs: [{ name: "predictions", type: "predictions" }],
      metadata: {
        paramCount: "rapid",
        backbone: "SAM3 + fine-tune",
        taskCompat: ["object_detection"],
        trainingStatus: "trained",
        classes: found.join(", "),
        sampleCount: files.length,
      },
    };
    addAsset(asset);
    onComplete?.(asset);
    close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={close}>
      <div
        className="relative flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-0 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-accent/5 via-surface-0 to-accent/5 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-bold text-text-primary">Build a Custom Detector</div>
              <div className="text-[11px] text-text-muted">Rapid model creation  -  Start small, grow with your data</div>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            <StepChip label="Build" active={step === "build"} done={step === "review" || step === "use"} />
            <span className="h-px w-6 bg-border" />
            <StepChip label="Review" active={step === "review"} done={step === "use"} />
            <span className="h-px w-6 bg-border" />
            <StepChip label="Use" active={step === "use"} />
          </div>

          <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "build" && (
            <div className="grid h-full grid-cols-2 gap-4 p-5">
              {/* Files panel */}
              <div className="flex flex-col rounded-xl border border-border bg-surface-1">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">Files</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                      {files.length}
                    </span>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Files
                  </Button>
                </div>

                <div
                  className="flex-1 overflow-y-auto p-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                >
                  {files.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-0 px-6 py-10 text-center">
                      <Upload className="h-8 w-8 text-text-muted opacity-50" />
                      <div className="text-sm font-semibold text-text-primary">Drop images / videos here</div>
                      <div className="text-[11px] text-text-muted">Or click "Add Files" above</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {files.map((f) => (
                        <div key={f.id} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface-0">
                          {f.mime.startsWith("image/") ? (
                            <img src={f.dataUrl} alt={f.name} className="h-full w-full object-cover" />
                          ) : (
                            <video src={f.dataUrl} className="h-full w-full object-cover" />
                          )}
                          <button
                            onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                            className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt panel */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-gradient-to-br from-accent/5 via-surface-0 to-accent/10 p-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-0 shadow-sm">
                  <Wand2 className="h-6 w-6 text-accent" />
                </div>
                <div className="mb-0.5 text-lg font-bold text-text-primary">What objects are you looking for?</div>
                <div className="mb-5 text-[11px] text-text-muted">
                  Powered by <span className="font-semibold text-accent">SAM3</span> - type what you want to find
                </div>

                <div className="w-full max-w-md space-y-3">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter objects: person, car, dog..."
                    className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    onClick={handleFindObjects}
                    disabled={!canFind || isSearching}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold shadow-sm transition-all",
                      canFind && !isSearching
                        ? "bg-accent text-white hover:bg-accent-hover"
                        : "cursor-not-allowed bg-accent/40 text-white",
                    )}
                  >
                    {isSearching ? (
                      <>
                        <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                        Finding objects...
                      </>
                    ) : (
                      <>
                        Find My Objects
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {suggestions.length > 0 && !isSearching && (
                  <div className="mt-5 flex w-full max-w-md flex-wrap items-center justify-center gap-1.5">
                    <span className="text-[11px] text-text-muted">Try these:</span>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPrompt((p) => (p ? `${p}, ${s}` : s))}
                        className="rounded-full border border-border bg-surface-0 px-2.5 py-0.5 text-[11px] text-text-secondary hover:border-accent hover:text-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div className="mt-4 rounded-md bg-warning/10 px-3 py-1.5 text-[11px] text-warning">
                    Upload at least one image on the left first.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="grid h-full grid-cols-[1fr_360px] gap-4 p-5">
              {/* Preview */}
              <div className="overflow-hidden rounded-xl border border-border bg-black/80">
                {files[0] ? (
                  <div className="relative h-full w-full">
                    <img src={files[0].dataUrl} alt="preview" className="h-full w-full object-contain" />
                    {/* Mock bounding boxes for found objects */}
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {objects.filter((o) => o.found).slice(0, 4).map((o, i) => {
                        const x = 10 + i * 18;
                        const y = 25 + (i % 2) * 30;
                        return (
                          <g key={o.id}>
                            <rect x={x} y={y} width={16} height={14} fill="none" stroke={o.color} strokeWidth="0.6" />
                            <rect x={x} y={y - 3} width={o.label.length * 1.6} height="3" fill={o.color} />
                            <text x={x + 0.5} y={y - 0.6} fontSize="2" fill="white" fontWeight="600">
                              {o.label} {Math.floor(70 + Math.random() * 25)}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">No preview</div>
                )}
              </div>

              {/* Review panel */}
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-surface-1 p-4">
                  <div className="mb-1 text-sm font-semibold text-text-primary">How is your model looking?</div>
                  <p className="text-[11px] text-text-muted">
                    Adjust the confidence slider to show more or fewer detections before you decide.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-1 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Objects detected</div>
                    <span className="text-[10px] text-text-muted">{objects.filter((o) => o.found).length} / {objects.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {objects.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />
                        <span className="flex-1 font-mono text-xs text-text-primary">{o.label}</span>
                        {o.found ? (
                          <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                            {o.count} found
                          </span>
                        ) : (
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                            not found
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-1 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Confidence threshold</label>
                    <span className="rounded bg-accent/10 px-1.5 py-px font-mono text-[11px] font-semibold text-accent">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div className="mt-0.5 flex justify-between text-[9px] text-text-disabled">
                    <span>More objects</span>
                    <span>Higher accuracy</span>
                  </div>
                </div>

                <div className="flex-1" />

                <div className="space-y-2">
                  <button
                    onClick={() => setStep("use")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover"
                  >
                    Use Model <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setStep("build")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Back to edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "use" && (
            <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Check className="h-7 w-7" />
                </div>
                <div className="text-lg font-bold text-text-primary">Your detector is ready</div>
                <p className="mt-1 text-[12px] text-text-muted">
                  Give it a name, then choose how to put it to work.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Model name</label>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder={`Custom ${prompt.split(/[,\s]+/)[0] || "detector"}`}
                  className="w-full rounded-md border border-border bg-surface-0 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <UseCard
                  icon={Play}
                  title="Deploy Model"
                  subtitle="Use on video or images right now"
                  accent="#8b5cf6"
                  onClick={handleCreateModel}
                />
                <UseCard
                  icon={TrendingUp}
                  title="Improve Model"
                  subtitle="Retrain with more annotated data"
                  accent="#0ea5e9"
                  onClick={handleCreateModel}
                />
                <UseCard
                  icon={Workflow}
                  title="Add to Pipeline"
                  subtitle="Use inside the builder with alerts & logic"
                  accent="#f97316"
                  onClick={handleCreateModel}
                  primary
                />
              </div>

              <div className="rounded-xl border border-dashed border-border bg-surface-1 p-4 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
                  <Download className="h-3.5 w-3.5" />
                  Trained on {files.length} image{files.length === 1 ? "" : "s"}  -  {objects.filter((o) => o.found).length} classes
                </div>
                <div className="text-[10px] text-text-disabled">
                  The model is saved to <span className="font-semibold text-text-secondary">{"MY ASSETS -> Models"}</span> once you pick an action.
                </div>
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setStep("review")}
                className="flex items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                â† Back to review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StepChip({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
          done ? "bg-success text-white" : active ? "bg-accent text-white" : "bg-surface-2 text-text-muted",
        )}
      >
        {done ? <Check className="h-3 w-3" /> : active ? "*" : "*‹"}
      </span>
      <span
        className={cn(
          "text-[11px] font-semibold",
          active ? "text-text-primary" : done ? "text-success" : "text-text-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function UseCard({
  icon: Icon, title, subtitle, accent, onClick, primary,
}: {
  icon: typeof Play;
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        primary ? "border-accent bg-accent/5" : "border-border bg-surface-0 hover:border-accent/40",
      )}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-text-muted">{subtitle}</div>
      </div>
    </button>
  );
}
