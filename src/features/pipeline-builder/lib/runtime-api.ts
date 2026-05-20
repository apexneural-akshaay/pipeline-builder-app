const BACKEND =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4001";

export interface NodeTestResult {
  ok: boolean;
  result?: any;
  error?: string;
  traceback?: string;
  stderr_tail?: string;
}

export async function testNode(
  nodeType: string,
  config: Record<string, any>,
  upstream?: any,
): Promise<NodeTestResult> {
  const res = await fetch(`${BACKEND}/nodes/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeType, config, upstream }),
  });
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` };
  }
  return res.json();
}

export async function startPipeline(pipeline: any): Promise<{ runId: string } | { error: string }> {
  const res = await fetch(`${BACKEND}/pipelines/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pipeline),
  });
  if (!res.ok) {
    let err: any = await res.text();
    try { err = JSON.parse(err); } catch {}
    return { error: err?.message ?? err ?? `HTTP ${res.status}` };
  }
  return res.json();
}

export async function stopPipeline(runId: string): Promise<void> {
  await fetch(`${BACKEND}/pipelines/runs/${runId}/stop`, { method: "POST" });
}

export interface LogEntry {
  time: number;
  stream: "stdout" | "stderr" | "meta";
  line: string;
}

/** Opens an SSE stream for a running pipeline. Returns a cleanup function. */
export function subscribeRun(
  runId: string,
  onLog: (entry: LogEntry) => void,
  onStatus: (status: string, exitCode: number | null) => void,
): () => void {
  const es = new EventSource(`${BACKEND}/pipelines/runs/${runId}/stream`);
  es.onmessage = (ev) => {
    try {
      const entry = JSON.parse(ev.data);
      onLog(entry);
    } catch {}
  };
  es.addEventListener("status", (ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      onStatus(data.status, data.exitCode ?? null);
    } catch {}
  });
  es.onerror = () => {
    // Auto-reconnect is built into EventSource; nothing to do.
  };
  return () => es.close();
}
