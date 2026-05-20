"use client";

import { ChevronDown, ChevronUp, Trash2, Copy, Check, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LogEntry } from "../../lib/runtime-api";

interface Props {
  expanded: boolean;
  onToggle: () => void;
  status: "idle" | "starting" | "running" | "stopped" | "exited" | "failed";
  logs: LogEntry[];
  onClear?: () => void;
}

export function RunPanel({ expanded, onToggle, status, logs, onClear }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  if (status === "idle" && logs.length === 0) return null;

  const eventCount = logs.filter((l) => l.line.includes("event ") && l.line.includes("fired")).length;
  const isLive = status === "starting" || status === "running";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs.map((l) => l.line).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface-1 shadow-modal">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-surface-2"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-text-secondary">
            <Terminal className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-text-primary">Run logs</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium text-text-secondary">
            {logs.length} {logs.length === 1 ? "line" : "lines"}
          </span>
          {eventCount > 0 && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              {eventCount} event{eventCount === 1 ? "" : "s"} fired
            </span>
          )}
          <StatusBadge status={status} live={isLive} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {logs.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1 rounded p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="Copy logs"
            >
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
          {onClear && logs.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="Clear logs"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          <div className="ml-1 text-text-muted">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-[300px] overflow-y-auto bg-[#0b1020] px-4 py-2.5 font-mono text-[11px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500">Waiting for output...</div>
          ) : (
            logs.map((l, i) => {
              const isHeartbeat = l.line.includes("heartbeat") || l.line.startsWith("⌛");
              const colorClass =
                l.stream === "stderr"
                  ? "text-rose-300"
                  : l.stream === "meta"
                  ? "text-sky-300"
                  : isHeartbeat
                  ? "text-indigo-300/70"
                  : "text-slate-100";
              return (
                <div key={i} className={`whitespace-pre-wrap break-words ${colorClass}`}>
                  {l.line}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, live }: { status: string; live: boolean }) {
  const variant = live
    ? "border-success/30 bg-success/10 text-success"
    : status === "failed"
    ? "border-error/30 bg-error/10 text-error"
    : "border-border bg-surface-2 text-text-muted";
  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${variant}`}
    >
      {live && (
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
      )}
      {status}
    </span>
  );
}
