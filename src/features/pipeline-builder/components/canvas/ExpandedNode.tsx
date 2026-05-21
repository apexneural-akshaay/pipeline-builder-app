"use client";

import {
  Info, FileCode, Play, Pencil, StickyNote, Trash2, AlertTriangle,
  ChevronDown, ChevronRight, X, Plus, Minimize2, Network, Sparkles, Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { BlockDef, PipelineEdge, PipelineNode } from "../../types/block.types";
import { catStyle } from "../../data/cat-styles";
import { findBlockDef } from "../../data/block-catalog";
import { getConfigFields } from "../../data/config-fields";
import { ConfigFieldRenderer } from "../config/ConfigFieldRenderer";
import { useAssetsStore } from "../../stores/assets.store";
import { SelectSourcePopover } from "./SelectSourcePopover";
import { SelectModelDialog } from "../rapid/SelectModelDialog";
import { RapidBuilderDialog } from "../rapid/RapidBuilderDialog";
import type { WorkflowInput } from "./InputsNode";

interface Props {
  node: PipelineNode;
  edges: PipelineEdge[];
  allNodes: PipelineNode[];
  workflowInputs: WorkflowInput[];
  onClose: () => void;
  onDelete: () => void;
  onLabelChange: (label: string) => void;
  onConfigChange: (key: string, value: string) => void;
  onStartDrag: (ev: React.MouseEvent) => void;
  onPortMouseDown: (port: number, x: number, y: number) => void;
  onPortMouseUp: (port: number) => void;
  /** Creates an edge from a picked source into this node's input port */
  onConnectInput: (sourceId: string, targetPort: number, sourcePort?: number) => void;
  /** Deletes an existing edge targeting this input */
  onDisconnectInput: (edgeId: string) => void;
}

// Expanded dimensions
const CARD_W = 360;

export function ExpandedNode({
  node, edges, allNodes, workflowInputs,
  onClose, onDelete, onLabelChange, onConfigChange,
  onStartDrag, onPortMouseDown, onPortMouseUp,
  onConnectInput, onDisconnectInput,
}: Props) {
  const def: BlockDef | undefined = findBlockDef(node.type);
  const style = catStyle(node.category);
  const getAsset = useAssetsStore((s) => s.getAsset);
  const asset = node.assetRef ? getAsset(node.assetRef.id) : undefined;

  const fields = getConfigFields(node.type);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /** Walk edges backwards from `nodeId` until we find a yolo_model node, or
   *  bail after a depth limit. Returns its config or undefined.
   *
   *  This lets the condition block's class dropdown show ONLY the classes
   *  the upstream model is actually emitting (i.e. the classes the user
   *  selected in the model block) — not every class the model knows about. */
  function findUpstreamModelConfig(nodeId: string, depth = 0): Record<string, any> | undefined {
    if (depth > 6) return undefined;
    const incoming = edges.find((e) => e.target === nodeId);
    if (!incoming) return undefined;
    const parent = allNodes.find((n) => n.id === incoming.source);
    if (!parent) return undefined;
    if (parent.type === "yolo_model") return parent.config as Record<string, any>;
    return findUpstreamModelConfig(parent.id, depth + 1);
  }

  // Augment the config we pass to ConfigFieldRenderer with upstream-model info,
  // so widgets like the RuleBuilder can restrict their class dropdown.
  const upstreamModelCfg = findUpstreamModelConfig(node.id);
  const enrichedAllValues = {
    ...(node.config as Record<string, string>),
    ...(upstreamModelCfg
      ? {
          _upstream_filename: String(upstreamModelCfg.filename ?? ""),
          _upstream_classes: String(upstreamModelCfg.classes ?? ""), // comma-sep list as stored
          _upstream_task: String(upstreamModelCfg.task ?? ""),
        }
      : {}),
  };
  const [renaming, setRenaming] = useState(false);
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [rapidOpen, setRapidOpen] = useState(false);

  // "Saved" indicator — flashes when a config value changes
  const [savedFlash, setSavedFlash] = useState(false);
  const lastConfigRef = useRef<string>(JSON.stringify(node.config));
  useEffect(() => {
    const next = JSON.stringify(node.config);
    if (lastConfigRef.current !== next) {
      lastConfigRef.current = next;
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [node.config]);

  // Split required vs optional fields
  const required = fields.filter((f) => f.required);
  const optional = fields.filter((f) => !f.required);

  // Validation: any required field empty = missing
  const missingCount = required.filter((f) => !node.config[f.key]).length;

  const inputs = asset ? asset.inputs : (def?.inputs ?? []).map((t) => ({ name: t, type: t }));
  const outputs = asset ? asset.outputs : (def?.outputs ?? []).map((t) => ({ name: t, type: t }));

  const Icon = def?.icon;

  return (
    <div
      data-expanded-node
      className="absolute z-20 select-none rounded-2xl border-2 bg-surface-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
      style={{
        left: node.x,
        top: node.y,
        width: CARD_W,
        borderColor: style.border,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top action toolbar (above the card) */}
      <div
        className="absolute -top-9 left-0 flex items-center gap-0.5 rounded-lg border border-border bg-surface-0 px-1 py-1 shadow-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ToolbarIcon icon={Info} title="Info" />
        <ToolbarIcon icon={FileCode} title="View JSON" />
        <div className="mx-0.5 h-4 w-px bg-border" />
        <ToolbarIcon icon={Play} title="Test" />
        <ToolbarIcon icon={Pencil} title="Rename" onClick={() => setRenaming((r) => !r)} />
        <ToolbarIcon icon={StickyNote} title="Add note" />
        <div className="mx-0.5 h-4 w-px bg-border" />
        <ToolbarIcon icon={Trash2} title="Delete" danger onClick={onDelete} />
        <ToolbarIcon icon={X} title="Close" onClick={onClose} />
      </div>

      {/* Drag handle - top area above header */}
      <div
        className="absolute -top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 cursor-grab rounded-full bg-surface-3 active:cursor-grabbing"
        onMouseDown={onStartDrag}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2.5 rounded-t-2xl px-4 py-3 cursor-grab active:cursor-grabbing"
        style={{ background: `${style.iconBg}55` }}
        onMouseDown={onStartDrag}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm"
          style={{ background: style.iconBg, color: style.iconColor }}
        >
          {asset ? <span className="text-base">{asset.icon ?? "*"}</span> : Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: style.iconColor }}>
            {def?.label ?? asset?.name ?? node.category}
          </div>
          {renaming ? (
            <input
              value={node.label}
              onChange={(e) => onLabelChange(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => e.key === "Enter" && setRenaming(false)}
              autoFocus
              className="w-full rounded bg-surface-0 px-1 font-mono text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          ) : (
            <div className="truncate font-mono text-sm font-semibold text-text-primary">
              {node.label}
            </div>
          )}
        </div>
        {savedFlash && (
          <span
            className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success animate-fade-in"
            title="Changes saved"
          >
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        {missingCount > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning" title={`${missingCount} required input${missingCount > 1 ? "s" : ""} missing`}>
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
        )}
        {/* Prominent collapse button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          title="Collapse"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-4 py-3 space-y-4">
        {/* Input slots - each has a "Select ..." picker AND a port dot for drag-connect */}
        {inputs.length > 0 && (
          <div className="space-y-3">
            {inputs.map((port, i) => {
              const incoming = edges.find((e) => e.target === node.id && (e.targetPort ?? 0) === i);
              const incomingLabel = incoming ? getIncomingLabel(incoming, allNodes, workflowInputs) : null;
              const prettyName = titleCase(port.name);
              return (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">
                      {prettyName}
                      <span className="ml-1 text-error">*</span>
                    </label>
                    {incoming && (
                      <button
                        onClick={() => onDisconnectInput(incoming.id)}
                        className="text-[10px] text-text-muted hover:text-error hover:underline"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    {incoming ? (
                      <div className="flex w-full items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-xs text-success">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="truncate font-mono">{incomingLabel}</span>
                      </div>
                    ) : (
                      <button
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-surface-1 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickerOpenFor(pickerOpenFor === i ? null : i);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Select {prettyName}
                      </button>
                    )}

                    <SelectSourcePopover
                      open={pickerOpenFor === i}
                      onClose={() => setPickerOpenFor(null)}
                      expected={port.type || port.name}
                      workflowInputs={workflowInputs}
                      allNodes={allNodes}
                      currentNodeId={node.id}
                      onSelect={(sel) => {
                        if (sel.kind === "workflow-input") {
                          onConnectInput(`io:in:${sel.inputId}`, i, 0);
                        } else if (sel.kind === "node-output") {
                          onConnectInput(sel.nodeId, i, sel.portIndex);
                        }
                        setPickerOpenFor(null);
                      }}
                    />

                    {/* Port dot on the left edge (for drag-connect) */}
                    <button
                      className="absolute -left-[22px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-surface-0 bg-surface-3 hover:scale-125"
                      onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(i); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title={port.name}
                    />
                  </div>
                  {!incoming && (
                    <div className="mt-1 text-[10px] text-error">Required input is missing</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Required fields */}
        {required.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <span>Required</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {required.map((f) => {
              // Special: the "model" field opens a full Select-a-Model dialog (Public + Your + Rapid)
              if (f.key === "model") {
                const current = node.config.model ?? "";
                return (
                  <div key={f.key}>
                    <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-text-primary">
                      Model <span className="text-error">*</span>
                    </label>
                    <div className="text-[10px] text-text-muted mb-1">Platform model identifier.</div>
                    <button
                      onClick={() => setModelPickerOpen(true)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
                        current
                          ? "border-accent/30 bg-accent/5 text-text-primary hover:bg-accent/10"
                          : "border-error/30 bg-error/5 text-error hover:bg-error/10",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Network className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-mono">{current || "No Model Selected"}</span>
                      </span>
                      <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </button>
                    {!current && <div className="mt-1 text-[10px] text-error">Required input is missing</div>}
                  </div>
                );
              }
              return (
                <div key={f.key}>
                  <label className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-text-primary">
                    {f.label}
                    <span className="text-error">*</span>
                  </label>
                  {f.description && <div className="mb-1 text-[10px] text-text-muted">{f.description}</div>}
                  <ConfigFieldRenderer
                    field={f}
                    value={node.config[f.key] ?? ""}
                    onChange={(v) => onConfigChange(f.key, v)}
                    allValues={enrichedAllValues}
                    onMultiChange={(patch) => {
                      for (const [k, v] of Object.entries(patch)) onConfigChange(k, v);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Properties toggle */}
        {optional.length > 0 && (
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-border bg-surface-1 px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {showAdvanced ? "Hide" : "Show"} Additional Properties
              <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10px] text-text-muted">
                {optional.length}
              </span>
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2.5">
                {optional.map((f) => (
                  <div key={f.key}>
                    <label className="mb-0.5 block text-xs font-medium text-text-secondary">{f.label}</label>
                    {f.description && <div className="mb-1 text-[10px] text-text-muted">{f.description}</div>}
                    <ConfigFieldRenderer
                    field={f}
                    value={node.config[f.key] ?? ""}
                    onChange={(v) => onConfigChange(f.key, v)}
                    allValues={enrichedAllValues}
                    onMultiChange={(patch) => {
                      for (const [k, v] of Object.entries(patch)) onConfigChange(k, v);
                    }}
                  />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {fields.length === 0 && !asset && (
          <div className="rounded-md border border-dashed border-border bg-surface-1 px-3 py-4 text-center text-[11px] text-text-muted">
            This block has no configuration options.
          </div>
        )}

        {/* Asset metadata */}
        {asset && (
          <div className="rounded-md border border-border bg-surface-1 p-2.5 text-[11px] space-y-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{asset.kind} metadata</div>
            {Object.entries(asset.metadata ?? {})
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-text-muted">{k}</span>
                  <span className="truncate font-mono text-text-secondary">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 border-t border-border px-4 py-2 text-[10px] text-text-muted">
        Powered by <span className="font-semibold text-text-secondary">Vision Platform</span>
      </div>

      {/* Output ports on the right edge */}
      {outputs.map((port, i) => {
        const yPct = ((i + 1) / (outputs.length + 1)) * 100;
        return (
          <button
            key={`out-${i}`}
            className="absolute h-3.5 w-3.5 rounded-full border-2 border-surface-0 hover:scale-125"
            style={{
              background: style.border,
              top: `calc(${yPct}% - 7px)`,
              right: -7,
            }}
            title={port.name}
            onMouseDown={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onPortMouseDown(i, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }}
          />
        );
      })}

      {/* Model picker dialog (Your / Public + New Model dropdown) */}
      <SelectModelDialog
        open={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        onPick={(modelId, displayName) => {
          onConfigChange("model", modelId);
          setModelPickerOpen(false);
          // also rename the block to the selected model for at-a-glance clarity
          if (!node.label || node.label === findBlockDef(node.type)?.label) {
            onLabelChange(displayName);
          }
        }}
        onStartRapid={() => { setModelPickerOpen(false); setRapidOpen(true); }}
      />

      {/* Rapid wizard */}
      <RapidBuilderDialog
        open={rapidOpen}
        onClose={() => setRapidOpen(false)}
        onComplete={(asset) => {
          onConfigChange("model", asset.id);
          onLabelChange(asset.name);
          setRapidOpen(false);
        }}
      />
    </div>
  );
}

function ToolbarIcon({
  icon: Icon, title, onClick, danger,
}: {
  icon: typeof Info;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        danger ? "text-text-muted hover:bg-error/10 hover:text-error" : "text-text-muted hover:bg-surface-2 hover:text-text-primary",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function titleCase(s: string): string {
  return s.split(/[_\s-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Human label shown when an input is already connected - e.g. "image (workflow input)" or "object_detect / detections". */
function getIncomingLabel(edge: PipelineEdge, allNodes: PipelineNode[], workflowInputs: WorkflowInput[]): string {
  if (edge.source.startsWith("io:in:")) {
    const wi = workflowInputs.find((w) => w.id === edge.source.slice(6));
    return wi ? `${wi.name} (workflow input)` : "workflow input";
  }
  const src = allNodes.find((n) => n.id === edge.source);
  if (!src) return "unknown source";
  return `${src.label}`;
}
