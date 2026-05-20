"use client";

import { X, Pencil, FileVideo, Webcam, Radio, ChevronRight, Lock, Play, Cpu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  onRun: () => void;
  isRunning?: boolean;
}

type MediaSource = "file" | "webcam" | "rtsp";

export function RunWorkflowPanel({ open, onClose, onRun, isRunning }: Props) {
  const [source, setSource] = useState<MediaSource>("rtsp");
  const [rtspUrl, setRtspUrl] = useState("rtsp://demo.apexneural.com:8554");
  const [authOpen, setAuthOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gpu, setGpu] = useState<"Small" | "Medium" | "Large">("Medium");

  if (!open) return null;

  return (
    <aside className="absolute right-0 top-0 z-30 flex h-full w-[420px] flex-col border-l border-border bg-surface-0 shadow-[0_0_40px_-8px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-text-primary" />
          <h2 className="text-base font-semibold text-text-primary">Run Workflow</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Input section */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary">Input</span>
            <button className="text-text-muted hover:text-text-primary"><Pencil className="h-3 w-3" /></button>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Media</label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface-1 p-0.5">
              <SourceTab active={source === "file"} onClick={() => setSource("file")} icon={FileVideo}>File</SourceTab>
              <SourceTab active={source === "webcam"} onClick={() => setSource("webcam")} icon={Webcam}>Webcam</SourceTab>
              <SourceTab active={source === "rtsp"} onClick={() => setSource("rtsp")} icon={Radio}>RTSP</SourceTab>
            </div>
          </div>

          {source === "file" && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-1 px-4 py-8 text-center">
              <FileVideo className="h-8 w-8 text-text-muted opacity-50" />
              <div className="text-xs font-semibold text-text-primary">Drop a video or image</div>
              <div className="text-[11px] text-text-muted">.mp4, .mov, .jpg, .png</div>
            </div>
          )}

          {source === "webcam" && (
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Device</label>
              <select className="w-full rounded-md border border-border bg-surface-0 px-2 py-1.5 text-xs">
                <option>Default camera</option>
              </select>
            </div>
          )}

          {source === "rtsp" && (
            <>
              <input
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://..."
                className="w-full rounded-md border border-border bg-surface-0 px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={() => setAuthOpen((v) => !v)}
                className="mt-2 flex w-full items-center gap-1.5 rounded-md border border-border bg-surface-0 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", authOpen && "rotate-90")} />
                <Lock className="h-3.5 w-3.5" />
                Authentication
              </button>
              {authOpen && (
                <div className="mt-2 space-y-2 rounded-md border border-border bg-surface-1 p-2.5">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full rounded border border-border bg-surface-0 px-2 py-1 text-xs"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="w-full rounded border border-border bg-surface-0 px-2 py-1 text-xs"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* GPU chip */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-3 py-2 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-text-muted" />
            <span>GPU</span>
            <span className="font-semibold text-text-primary">{gpu}</span>
            <span className="text-text-disabled"> - </span>
            <span>AP</span>
            <span className="text-text-disabled"> - </span>
            <span>Sequential</span>
            <span className="text-text-disabled"> - </span>
            <span>60 min</span>
          </div>
          <button
            onClick={() => {
              const levels: ("Small" | "Medium" | "Large")[] = ["Small", "Medium", "Large"];
              const i = levels.indexOf(gpu);
              setGpu(levels[(i + 1) % levels.length]);
            }}
            className="text-text-muted hover:text-text-primary"
            title="Change"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold shadow-sm transition-all",
            isRunning
              ? "cursor-wait bg-accent/30 text-white"
              : "bg-accent text-white hover:bg-accent-hover hover:shadow-[0_8px_20px_-4px] hover:shadow-accent/50",
          )}
        >
          {isRunning ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Running workflow...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run
            </>
          )}
        </button>

        {/* Output section */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary">Output</span>
            <button className="text-text-muted hover:text-text-primary"><Pencil className="h-3 w-3" /></button>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-surface-1 px-4 py-10 text-center">
            <div className="text-xs text-text-muted">
              <span className="font-semibold text-accent">Test Workflow</span> to see the output here.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SourceTab({ active, onClick, icon: Icon, children }: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileVideo;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-all",
        active
          ? "bg-surface-0 text-text-primary shadow-sm"
          : "text-text-muted hover:text-text-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
