"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Clock,
  Inbox,
} from "lucide-react";

interface Detection {
  class: string;
  confidence: number;
  bbox: number[] | null;
  task?: string;
}

interface EventRecord {
  node: string;
  pipeline: string;
  triggered_at: number;
  detections: Detection[];
  screenshot: string | null;
  clip: string | null;
}

interface SidecarFrame {
  ts?: number;
  time?: number;
  frame?: number;
  detections?: Detection[];
}

interface SidecarData {
  frames?: SidecarFrame[];
  detections?: Detection[];
  task?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

type TimeRange = "all" | "1h" | "24h" | "7d";

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [hasClipOnly, setHasClipOnly] = useState(false);

  // Expanded card → sidecar detail
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sidecars, setSidecars] = useState<Record<number, SidecarData | "loading" | "error">>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const fname = (p: string | null) => (p ? p.split(/[\\/]/).pop() : null);

  // Filter pipeline names list
  const pipelineNames = useMemo(() => Array.from(new Set(events.map((e) => e.pipeline))).sort(), [events]);
  const [pipelineFilter, setPipelineFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const now = Date.now() / 1000;
    const cutoff =
      timeRange === "1h" ? now - 3600 :
      timeRange === "24h" ? now - 86400 :
      timeRange === "7d" ? now - 604800 :
      0;
    return events.filter((ev) => {
      if (cutoff && ev.triggered_at < cutoff) return false;
      if (hasClipOnly && !ev.clip) return false;
      if (pipelineFilter && ev.pipeline !== pipelineFilter) return false;
      if (search) {
        const hay = (ev.pipeline + " " + ev.node + " " + ev.detections.map((d) => d.class).join(" ")).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, timeRange, hasClipOnly, pipelineFilter, search]);

  // Fetch sidecar JSON when an event card is expanded
  async function loadSidecar(index: number, ev: EventRecord) {
    if (sidecars[index] && sidecars[index] !== "error") return;
    const base = fname(ev.screenshot) || fname(ev.clip);
    if (!base) {
      setSidecars((s) => ({ ...s, [index]: "error" }));
      return;
    }
    // Sidecar conventionally lives next to the screenshot/clip with .json extension
    const jsonName = base.replace(/\.(jpg|jpeg|png|mp4|webm)$/i, ".json");
    setSidecars((s) => ({ ...s, [index]: "loading" }));
    try {
      const res = await fetch(`${BACKEND_URL}/events/file/${jsonName}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setSidecars((s) => ({ ...s, [index]: data }));
    } catch {
      setSidecars((s) => ({ ...s, [index]: "error" }));
    }
  }

  function toggleExpand(index: number, ev: EventRecord) {
    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
      loadSidecar(index, ev);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-text-primary">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-surface-1 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Editor
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-sm font-semibold">Events &amp; Alerts</h1>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            {filtered.length}{filtered.length !== events.length ? ` / ${events.length}` : ""}
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-0 px-3 text-xs font-medium text-text-primary transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-1 px-4 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pipeline, node, class..."
            className="h-8 w-56 rounded-md border border-border bg-surface-0 pl-7.5 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            style={{ paddingLeft: "26px" }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border bg-surface-0 p-0.5 text-[11px]">
          {(["all", "1h", "24h", "7d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                timeRange === r
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              {r === "all" ? "All time" : r}
            </button>
          ))}
        </div>

        {pipelineNames.length > 1 && (
          <select
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface-0 px-2 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All pipelines</option>
            {pipelineNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}

        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface-0 px-2.5 text-xs text-text-secondary transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            checked={hasClipOnly}
            onChange={(e) => setHasClipOnly(e.target.checked)}
            className="h-3 w-3 accent-accent"
          />
          Has clip
        </label>

        {(search || timeRange !== "all" || hasClipOnly || pipelineFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setTimeRange("all");
              setHasClipOnly(false);
              setPipelineFilter("");
            }}
            className="ml-auto flex h-8 items-center gap-1 rounded-md px-2 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <Filter className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 rounded-md border border-error/40 bg-error/10 p-3 text-xs text-error">
            {error}
          </div>
        )}

        {/* Empty states */}
        {!loading && events.length === 0 && !error && (
          <EmptyState
            title="No events captured yet"
            description="Run a pipeline against a video source — detections will appear here with screenshots and clips."
          />
        )}
        {!loading && events.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No events match your filters"
            description="Try widening the time range or clearing filters."
            small
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev, i) => {
            const ts = new Date(ev.triggered_at * 1000);
            const task = ev.detections[0]?.task;
            const isOpen = expanded === i;
            const sidecar = sidecars[i];
            return (
              <article
                key={i}
                className={`group overflow-hidden rounded-lg border bg-surface-1 transition-all ${
                  isOpen ? "border-accent/40 shadow-card-hover" : "border-border hover:border-border-emphasis hover:shadow-card-hover"
                }`}
              >
                {ev.clip ? (
                  <video
                    src={`${BACKEND_URL}/events/file/${fname(ev.clip)}`}
                    poster={ev.screenshot ? `${BACKEND_URL}/events/file/${fname(ev.screenshot)}` : undefined}
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                  />
                ) : ev.screenshot ? (
                  <img
                    src={`${BACKEND_URL}/events/file/${fname(ev.screenshot)}`}
                    alt="event"
                    className="aspect-video w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-surface-2 text-text-muted">
                    <ImageIcon className="h-6 w-6 opacity-40" />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-text-primary">{ev.pipeline}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock className="h-3 w-3" />
                        {ts.toLocaleString()}
                      </div>
                    </div>
                    {task && (
                      <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-text-secondary">
                        {task}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {ev.detections.slice(0, 5).map((d, j) => (
                      <span
                        key={j}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                      >
                        {d.class} · {(d.confidence * 100).toFixed(0)}%
                      </span>
                    ))}
                    {ev.detections.length > 5 && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        +{ev.detections.length - 5}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[10px] text-text-muted">
                    {ev.screenshot && (
                      <a
                        href={`${BACKEND_URL}/events/file/${fname(ev.screenshot)}`}
                        download
                        className="flex items-center gap-1 transition-colors hover:text-text-primary"
                      >
                        <ImageIcon className="h-3 w-3" /> JPG
                      </a>
                    )}
                    {ev.clip && (
                      <a
                        href={`${BACKEND_URL}/events/file/${fname(ev.clip)}`}
                        download
                        className="flex items-center gap-1 transition-colors hover:text-text-primary"
                      >
                        <Film className="h-3 w-3" /> MP4
                      </a>
                    )}
                    <button
                      onClick={() => toggleExpand(i, ev)}
                      className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-surface-2 hover:text-text-primary"
                    >
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isOpen ? "Hide details" : "Details"}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        <Activity className="h-3 w-3" />
                        All detections
                      </div>
                      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-surface-0 p-2">
                        {ev.detections.length === 0 ? (
                          <div className="text-[10px] text-text-muted">No detections.</div>
                        ) : (
                          ev.detections.map((d, j) => (
                            <div key={j} className="flex items-center justify-between text-[11px]">
                              <span className="text-text-primary">{d.class}</span>
                              <span className="font-mono text-text-muted">{(d.confidence * 100).toFixed(0)}%</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-3 mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        <Clock className="h-3 w-3" />
                        Frame timeline
                      </div>
                      {sidecar === "loading" && (
                        <div className="text-[10px] text-text-muted">Loading sidecar...</div>
                      )}
                      {sidecar === "error" && (
                        <div className="text-[10px] text-text-muted">No sidecar JSON found for this event.</div>
                      )}
                      {sidecar && sidecar !== "loading" && sidecar !== "error" && (
                        <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-surface-0 p-2">
                          {(sidecar.frames ?? []).length === 0 ? (
                            <div className="text-[10px] text-text-muted">Sidecar has no frame data.</div>
                          ) : (
                            (sidecar.frames ?? []).slice(0, 50).map((f, j) => (
                              <div key={j} className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-text-secondary">
                                  {f.frame != null ? `frame ${f.frame}` : f.ts != null ? `t=${f.ts.toFixed(2)}s` : `#${j}`}
                                </span>
                                <span className="text-text-muted">
                                  {f.detections?.length ?? 0} det
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, small }: { title: string; description: string; small?: boolean }) {
  return (
    <div className={`mx-auto flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-1 text-center ${small ? "max-w-md p-6" : "max-w-lg p-10"}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-0 text-text-muted">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-text-muted">{description}</p>
      {!small && (
        <Link
          href="/"
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to editor
        </Link>
      )}
    </div>
  );
}
