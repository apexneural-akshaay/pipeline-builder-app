"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Trophy, ExternalLink, Plus, BookCopy, Zap, Check, Network } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAssetsStore } from "../../stores/assets.store";
import type { ModelAsset } from "../../types/asset.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (modelId: string, displayName: string) => void;
  onStartRapid: () => void;
  onStartTraditional?: () => void;
}

interface FeaturedModel {
  id: string;
  name: string;
  description: string;
  size: string;
  featured?: boolean;
}

const FEATURED_PUBLIC_MODELS: FeaturedModel[] = [
  { id: "rf-detr-medium", name: "RF-DETR Medium", description: "A transformer-based detection model with enhanced object detection capabilities.", size: "Medium (576Ã—576)", featured: true },
  { id: "yolo26-nano",    name: "YOLO26",         description: "The newest model from Ultralytics with NMS-free inference and faster CPU performance.", size: "Nano (640Ã—640)", featured: true },
  { id: "yolov8-medium",  name: "YOLOv8 Medium",  description: "Balanced speed and accuracy, the go-to detector for most use cases.", size: "Medium (640Ã—640)", featured: true },
  { id: "yolov8-nano",    name: "YOLOv8 Nano",    description: "Edge-optimized variant - runs on Jetson Nano / Raspberry Pi.", size: "Nano (640Ã—640)", featured: true },
  { id: "people-detect",  name: "People Detection", description: "Detect people, trained on over 7,000 images.", size: "Medium" },
  { id: "vehicle-detect", name: "Vehicle Detection", description: "Detect cars, trucks, buses, and motorcycles.", size: "Medium" },
  { id: "ppe-detect",     name: "PPE Compliance Detection", description: "Hardhat / vest / mask compliance, trained on industrial footage.", size: "Small" },
  { id: "fire-smoke",     name: "Fire & Smoke",   description: "Flame and smoke detection for early-warning pipelines.", size: "Small" },
];

type Tab = "your" | "public";

export function SelectModelDialog({ open, onClose, onPick, onStartRapid, onStartTraditional }: Props) {
  const [tab, setTab] = useState<Tab>("public");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // User's own models from the assets store - stable selector to avoid re-render loops
  const allModels = useAssetsStore((s) => s.models);
  const userModels = useMemo(() => allModels.filter((m) => !m.isBuiltIn), [allModels]);
  const builtInModels = useMemo(() => allModels.filter((m) => m.isBuiltIn), [allModels]);

  // Combine built-in platform models with the hardcoded Featured Public list
  const publicModels = useMemo(() => {
    const fromAssets: FeaturedModel[] = builtInModels.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      size: String(m.metadata?.paramCount ?? "") || "Model",
      featured: true,
    }));
    const q = query.toLowerCase();
    return [...fromAssets, ...FEATURED_PUBLIC_MODELS].filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [builtInModels, query]);

  useEffect(() => {
    if (!newMenuOpen) return;
    const handle = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setNewMenuOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handle), 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handle); };
  }, [newMenuOpen]);

  if (!open) return null;

  const confirmPick = () => {
    if (!selected) return;
    const allPool: Array<{ id: string; name: string }> = [
      ...publicModels.map((p) => ({ id: p.id, name: p.name })),
      ...userModels.map((u: ModelAsset) => ({ id: u.id, name: u.name })),
    ];
    const hit = allPool.find((p) => p.id === selected);
    onPick(selected, hit?.name ?? selected);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-0 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Network className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-base font-bold text-text-primary">Select a Model</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border px-5">
          <TabButton active={tab === "your"} onClick={() => setTab("your")}>Your models</TabButton>
          <TabButton active={tab === "public"} onClick={() => setTab("public")}>Public models</TabButton>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "public" && (
            <div className="p-5">
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search public models or enter a model id..."
                  className="w-full rounded-lg border border-border bg-surface-0 pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="mb-2 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Featured Models</span>
              </div>

              <div className="space-y-0.5">
                {publicModels.map((m) => {
                  const isSelected = selected === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelected(m.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                        isSelected ? "bg-accent/5 ring-1 ring-accent/30" : "hover:bg-surface-2",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-text-primary">{m.name}</span>
                          {m.featured && <Trophy className="h-3 w-3 shrink-0 text-amber-500" />}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-text-muted">{m.description}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-muted">
                        {m.size}
                      </span>
                      {isSelected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "your" && (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              {userModels.length === 0 ? (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border">
                    <Plus className="h-8 w-8 text-text-muted" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">No Object Detection Models</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    Once you train an Object Detection model, it will appear here.
                  </p>

                  <div className="relative mt-6" ref={newMenuRef}>
                    <button
                      onClick={() => setNewMenuOpen((v) => !v)}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover"
                    >
                      <Plus className="h-4 w-4" />
                      New Model
                    </button>

                    {newMenuOpen && (
                      <div className="absolute left-1/2 top-full z-10 mt-2 w-[220px] -translate-x-1/2 rounded-xl border border-border bg-surface-0 shadow-modal">
                        <button
                          onClick={() => {
                            setNewMenuOpen(false);
                            onStartTraditional?.();
                          }}
                          className="group flex w-full items-center gap-2.5 rounded-t-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
                            <BookCopy className="h-3.5 w-3.5" />
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-text-primary">Traditional</div>
                            <div className="text-[10px] text-text-muted">Upload labeled data  -  hours</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setNewMenuOpen(false);
                            onClose();
                            onStartRapid();
                          }}
                          className="group flex w-full items-center gap-2.5 rounded-b-xl border-t border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/5"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
                            <Zap className="h-3.5 w-3.5" />
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 text-xs font-semibold text-text-primary">
                              Rapid
                              <span className="rounded bg-accent/15 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-accent">
                                New
                              </span>
                            </div>
                            <div className="text-[10px] text-text-muted">Prompt-based  -  minutes</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Your Models</span>
                    <div className="relative" ref={newMenuRef}>
                      <button
                        onClick={() => setNewMenuOpen((v) => !v)}
                        className="flex items-center gap-1 rounded-md border border-border bg-surface-0 px-2.5 py-1 text-xs font-semibold hover:bg-surface-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New Model
                      </button>
                      {newMenuOpen && (
                        <div className="absolute right-0 top-full z-10 mt-2 w-[220px] rounded-xl border border-border bg-surface-0 shadow-modal">
                          <button
                            onClick={() => { setNewMenuOpen(false); onStartTraditional?.(); }}
                            className="flex w-full items-center gap-2.5 rounded-t-xl px-3 py-2.5 text-left hover:bg-surface-2"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent"><BookCopy className="h-3.5 w-3.5" /></span>
                            <div className="flex-1"><div className="text-xs font-semibold">Traditional</div><div className="text-[10px] text-text-muted">Upload labeled data</div></div>
                          </button>
                          <button
                            onClick={() => { setNewMenuOpen(false); onClose(); onStartRapid(); }}
                            className="flex w-full items-center gap-2.5 rounded-b-xl border-t border-border px-3 py-2.5 text-left hover:bg-accent/5"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white"><Zap className="h-3.5 w-3.5" /></span>
                            <div className="flex-1"><div className="flex items-center gap-1 text-xs font-semibold">Rapid <span className="rounded bg-accent/15 px-1 py-px text-[9px] font-bold uppercase text-accent">New</span></div><div className="text-[10px] text-text-muted">Prompt-based</div></div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    {userModels.map((m) => {
                      const isSelected = selected === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelected(m.id)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                            isSelected ? "bg-accent/5 ring-1 ring-accent/30" : "hover:bg-surface-2",
                          )}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-lg">
                            {m.icon ?? "*"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-text-primary">{m.name}</div>
                            <div className="mt-0.5 truncate text-[11px] text-text-muted">{m.description}</div>
                          </div>
                          {isSelected && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border bg-surface-1 px-5 py-3">
          <button
            onClick={confirmPick}
            disabled={!selected}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors",
              selected ? "bg-accent text-white hover:bg-accent-hover" : "cursor-not-allowed bg-accent/30 text-white",
            )}
          >
            Select Model
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-3 text-sm font-semibold transition-colors",
        active ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
      )}
    >
      {children}
      {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t bg-accent" />}
    </button>
  );
}
