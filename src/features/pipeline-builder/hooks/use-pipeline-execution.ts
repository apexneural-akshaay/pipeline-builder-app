"use client";

import { useCallback, useState } from "react";
import type { PipelineNode } from "../types/block.types";

export interface ExecLog {
  t: number;
  level: "info" | "success" | "warn" | "error";
  nodeId?: string;
  message: string;
}

export function usePipelineExecution() {
  const [execOpen, setExecOpen] = useState(false);
  const [execTab, setExecTab] = useState<"logs" | "output" | "params">("logs");
  const [execLogs, setExecLogs] = useState<ExecLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const clearLogs = useCallback(() => setExecLogs([]), []);

  const runPipeline = useCallback(
    async (nodes: PipelineNode[]) => {
      if (nodes.length === 0) return;
      setExecOpen(true);
      setExecTab("logs");
      setIsRunning(true);
      setExecLogs([{ t: Date.now(), level: "info", message: `Pipeline start - ${nodes.length} nodes` }]);

      for (const n of nodes) {
        await new Promise((r) => setTimeout(r, 250));
        const err = Math.random() < 0.08;
        const msg = categoryMessage(n.category, n.label);
        setExecLogs((l) => [
          ...l,
          {
            t: Date.now(),
            level: err ? "error" : "success",
            nodeId: n.id,
            message: err ? `${n.label} - failed: ${msg}` : `${n.label} - ok: ${msg}`,
          },
        ]);
      }

      setExecLogs((l) => [...l, { t: Date.now(), level: "info", message: "Pipeline complete" }]);
      setIsRunning(false);
    },
    [],
  );

  return {
    execOpen, setExecOpen,
    execTab, setExecTab,
    execLogs, clearLogs,
    isRunning, runPipeline,
  };
}

function categoryMessage(category: string, label: string): string {
  switch (category) {
    case "Sources":      return `streaming frames from ${label}`;
    case "Transform":    return `applied ${label} augmentation`;
    case "Architecture": return `forward pass through ${label}`;
    case "Heads":        return `produced predictions`;
    case "Training":     return `${label} step complete`;
    case "Models":       return `inference via model`;
    case "Tasks":        return `task executed`;
    case "Datasets":     return `batch loaded`;
    case "Metrics":      return `metric computed`;
    case "Detect":       return `3 objects detected`;
    case "Analytics":    return `metric updated`;
    case "Rules":        return `filter applied`;
    case "Flow":         return `flow control`;
    case "Alerts":       return `notification dispatched`;
    case "Persist":      return `data saved`;
    case "Visualize":    return `frame annotated`;
    default:             return `${label} complete`;
  }
}

export type UsePipelineExecutionReturn = ReturnType<typeof usePipelineExecution>;
