"use client";

import { X, Terminal as TerminalIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PipelineNode } from "../../types/block.types";
import type { ExecLog } from "../../hooks/use-pipeline-execution";
import { LogsTab } from "./LogsTab";
import { OutputTab } from "./OutputTab";
import { ParamsTab } from "./ParamsTab";

interface Props {
  tab: "logs" | "output" | "params";
  setTab: (t: "logs" | "output" | "params") => void;
  logs: ExecLog[];
  nodes: PipelineNode[];
  params: Record<string, string | number>;
  onParamsChange: (key: string, value: string) => void;
  onClose: () => void;
  isRunning?: boolean;
}

export function ExecutionPanel({ tab, setTab, logs, nodes, params, onParamsChange, onClose, isRunning }: Props) {
  const tabs: Array<{ key: typeof tab; label: string; count?: number }> = [
    { key: "logs", label: "Logs", count: logs.length || undefined },
    { key: "output", label: "Node Output", count: nodes.length || undefined },
    { key: "params", label: "Hyperparameters" },
  ];

  return (
    <div className="flex h-[260px] shrink-0 flex-col border-t border-border bg-surface-1">
      {/* Tab strip */}
      <div className="flex h-10 shrink-0 items-center border-b border-border bg-surface-0">
        <div className="flex items-center gap-1.5 border-r border-border px-3">
          <div className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md",
            isRunning ? "bg-accent/20 text-accent" : "bg-surface-2 text-text-muted",
          )}>
            <TerminalIcon className="h-3 w-3" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Console
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-px text-[9px] font-semibold text-accent">
              <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
              LIVE
            </span>
          )}
        </div>

        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "group relative h-full px-4 text-xs font-medium transition-colors",
              tab === t.key ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
            )}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-px text-[9px] font-semibold",
                  tab === t.key ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-muted",
                )}>
                  {t.count}
                </span>
              )}
            </span>
            {tab === t.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t bg-accent" />}
          </button>
        ))}

        <div className="flex-1" />
        <button
          onClick={onClose}
          className="mr-2 flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "logs" && <LogsTab logs={logs} />}
        {tab === "output" && <OutputTab nodes={nodes} logs={logs} />}
        {tab === "params" && <ParamsTab params={params} onChange={onParamsChange} />}
      </div>
    </div>
  );
}
