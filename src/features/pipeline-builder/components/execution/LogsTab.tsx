"use client";

import { Check, X, AlertTriangle, Info } from "lucide-react";
import type { ExecLog } from "../../hooks/use-pipeline-execution";

interface Props {
  logs: ExecLog[];
}

const ICON_BY_LEVEL = {
  info: Info,
  success: Check,
  warn: AlertTriangle,
  error: X,
} as const;

const COLOR_BY_LEVEL = {
  info: { bg: "bg-surface-2", text: "text-text-muted" },
  success: { bg: "bg-success/15", text: "text-success" },
  warn: { bg: "bg-warning/15", text: "text-warning" },
  error: { bg: "bg-error/15", text: "text-error" },
} as const;

export function LogsTab({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-muted">
          <Info className="h-4 w-4" />
        </div>
        <div className="text-xs font-semibold text-text-primary">No logs yet</div>
        <div className="text-[11px] text-text-muted">Click <span className="text-text-secondary">Run</span> to test your pipeline.</div>
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] leading-5">
      {logs.map((l, i) => {
        const Icon = ICON_BY_LEVEL[l.level];
        const color = COLOR_BY_LEVEL[l.level];
        return (
          <div key={i} className="group flex items-start gap-2 border-b border-border/50 px-3 py-1.5 hover:bg-surface-0/50">
            <span className="shrink-0 text-text-disabled">
              {new Date(l.t).toLocaleTimeString(undefined, { hour12: false })}
            </span>
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${color.bg} ${color.text}`}
            >
              <Icon className="h-2.5 w-2.5" />
            </span>
            <span className="flex-1 text-text-secondary">{l.message}</span>
          </div>
        );
      })}
    </div>
  );
}
