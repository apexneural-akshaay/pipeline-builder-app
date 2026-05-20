"use client";

import { ArrowLeft, Bell, Rocket, Play, Square, Loader2, AlertCircle, Trash2 } from "lucide-react";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  onBack: () => void;
  onExport?: () => void;
  onRunPipeline?: () => void;
  onStopPipeline?: () => void;
  onClearCanvas?: () => void;
  runStatus?: "idle" | "starting" | "running" | "stopped" | "exited" | "failed";
  nodeCount?: number;
  // Unused-but-tolerated props (legacy)
  onAutoLayout?: () => void;
  onToggleExec?: () => void;
  onRun?: () => void;
  onSave?: () => void;
  onSaveAsAsset?: () => void;
  onOpenRunPanel?: () => void;
  isRunning?: boolean;
  hasSelection?: boolean;
  execOpen?: boolean;
  hasUnsavedChanges?: boolean;
  onDiscard?: () => void;
  alertCount?: number;
  builderAssistMode?: "manual" | "quick" | "auto";
  onBuilderAssistChange?: (mode: "manual" | "quick" | "auto") => void;
}

export function EditorToolbar({
  name, onNameChange, onBack, onExport,
  onRunPipeline, onStopPipeline, onClearCanvas, runStatus = "idle",
  nodeCount = 0,
}: Props) {
  const isStarting = runStatus === "starting";
  const isRunning = runStatus === "running";
  const isLive = isStarting || isRunning;
  const isFailed = runStatus === "failed";

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface-0 px-3 sm:gap-3 sm:px-4">
      {/* Left cluster: back + name */}
      <button
        onClick={onBack}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
        title="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="min-w-0 flex-1 max-w-[340px] rounded bg-transparent px-2 py-1 text-sm font-semibold text-text-primary hover:bg-surface-2 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent/30"
        placeholder="Untitled pipeline"
      />

      {/* Meta cluster: node count + status pill */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
          {nodeCount} block{nodeCount === 1 ? "" : "s"}
        </span>

        {runStatus !== "idle" && (
          <StatusPill status={runStatus} live={isLive} starting={isStarting} failed={isFailed} />
        )}
      </div>

      <div className="flex-1" />

      {/* Action cluster: events / export / run-stop */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <a
          href="/events"
          className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary sm:flex"
          title="Events & Alerts"
        >
          <Bell className="h-3.5 w-3.5" />
          Events
        </a>

        <button
          onClick={onClearCanvas}
          disabled={nodeCount === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-0 text-text-secondary transition-colors hover:border-error/40 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface-0 disabled:hover:text-text-secondary"
          title="Clear all blocks"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onExport}
          disabled={nodeCount === 0}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          title="Export inference.py"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {isLive ? (
          <button
            onClick={onStopPipeline}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-error px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-error/90"
            title="Stop pipeline"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        ) : (
          <button
            onClick={onRunPipeline}
            disabled={nodeCount === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            title="Run full pipeline"
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  status, live, starting, failed,
}: {
  status: string;
  live: boolean;
  starting: boolean;
  failed: boolean;
}) {
  if (live) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
        {starting ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : (
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
        )}
        {starting ? "starting" : "live"}
      </span>
    );
  }
  if (failed) {
    return (
      <span className="flex items-center gap-1 rounded-full border border-error/30 bg-error/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-error">
        <AlertCircle className="h-2.5 w-2.5" />
        failed
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
      {status}
    </span>
  );
}
