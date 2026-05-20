"use client";

import { X, Play, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { testNode, type NodeTestResult } from "../../lib/runtime-api";

interface Props {
  open: boolean;
  onClose: () => void;
  nodeType: string;
  nodeLabel: string;
  config: Record<string, any>;
  upstream?: any;
}

export function NodeTestModal({ open, onClose, nodeType, nodeLabel, config, upstream }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<NodeTestResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setRunning(true);
    testNode(nodeType, config, upstream)
      .then(setResult)
      .finally(() => setRunning(false));
  }, [open, nodeType, JSON.stringify(config), JSON.stringify(upstream)]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface-0 shadow-modal">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
              <Play className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Test block</h2>
              <p className="mt-0.5 truncate font-mono text-xs text-text-secondary">{nodeLabel}</p>
              <p className="mt-1 text-[11px] text-text-muted">
                Runs only this block to verify its config. Uses sample input if upstream isn't available.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {running && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Running test...
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="h-12 animate-pulse rounded-md border border-border bg-surface-1" />
                ))}
              </div>
              <div className="h-40 animate-pulse rounded-md border border-border bg-surface-1" />
            </div>
          )}

          {!running && result && !result.ok && (
            <div className="rounded-md border border-error/40 bg-error/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-error">
                <AlertTriangle className="h-4 w-4" /> Test failed
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-error/90">
                {result.error}
              </pre>
              {result.traceback && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-text-muted">Traceback</summary>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-text-muted">
                    {result.traceback}
                  </pre>
                </details>
              )}
            </div>
          )}

          {!running && result?.ok && (
            <NodeResultView nodeType={nodeType} result={result.result} />
          )}
        </div>
      </div>
    </div>
  );
}

function NodeResultView({ nodeType, result }: { nodeType: string; result: any }) {
  if (nodeType === "video_input") {
    return (
      <div className="space-y-3">
        <Stats
          stats={[
            ["Resolution", `${result.width} × ${result.height}`],
            ["Native FPS", result.native_fps ? result.native_fps.toFixed(1) : "n/a"],
            ["Target FPS", result.target_fps],
          ]}
        />
        {result.frame_jpg_b64 && (
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              First frame
            </div>
            <img
              src={`data:image/jpeg;base64,${result.frame_jpg_b64}`}
              alt="first frame"
              className="w-full rounded-md border border-border bg-black"
            />
          </div>
        )}
      </div>
    );
  }

  if (nodeType === "yolo_model") {
    return (
      <div className="space-y-3">
        <Stats
          stats={[
            ["Weights", result.weights_used],
            ["Task", result.task],
            ["Tracking", String(result.tracking)],
            ["Detections", result.detection_count],
          ]}
        />
        {result.annotated_jpg_b64 && (
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Annotated output
            </div>
            <img
              src={`data:image/jpeg;base64,${result.annotated_jpg_b64}`}
              alt="model output"
              className="w-full rounded-md border border-border bg-black"
            />
          </div>
        )}
        <DetectionsList detections={result.detections} />
      </div>
    );
  }

  if (nodeType === "condition") {
    return (
      <div className="space-y-3">
        <Stats
          stats={[
            ["Input detections", result.input_count],
            ["Passing", result.passing_count],
            ["Min confidence", result.min_confidence],
            ["Filter classes", result.filter_classes?.length ? result.filter_classes.join(", ") : "(any)"],
          ]}
        />
        <DetectionsList detections={result.passing_detections} />
      </div>
    );
  }

  if (nodeType === "event_sink") {
    return (
      <div className="space-y-3">
        <Stats
          stats={[
            ["Would fire", String(result.would_fire)],
            ["Save screenshot", String(result.save_screenshot)],
            ["Save clip", String(result.save_clip)],
            ["Clip length", `${result.clip_seconds}s`],
            ["Cooldown", `${result.cooldown_seconds}s`],
            ["Output dir", result.output_dir],
            ["Upstream detections", result.upstream_detection_count],
          ]}
        />
        <p className="text-[11px] text-text-muted">
          This is a config check only — actual files are written when you run the full pipeline.
        </p>
      </div>
    );
  }

  return <pre className="font-mono text-xs">{JSON.stringify(result, null, 2)}</pre>;
}

function Stats({ stats }: { stats: [string, any][] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(([k, v]) => (
        <div key={k} className="rounded-md border border-border bg-surface-1 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{k}</div>
          <div className="mt-0.5 font-mono text-xs text-text-primary">{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

function DetectionsList({ detections }: { detections: any[] }) {
  if (!detections?.length) {
    return <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-text-muted">No detections.</div>;
  }
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Detections</div>
      {detections.slice(0, 20).map((d, i) => (
        <div key={i} className="flex items-center justify-between rounded border border-border bg-surface-1 px-3 py-1.5">
          <span className="text-xs font-medium text-text-primary">{d.class}</span>
          <span className="font-mono text-[11px] text-text-muted">{(d.confidence * 100).toFixed(0)}%</span>
        </div>
      ))}
      {detections.length > 20 && (
        <div className="text-[10px] text-text-muted">+{detections.length - 20} more...</div>
      )}
    </div>
  );
}
