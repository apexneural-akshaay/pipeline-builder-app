"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { EditorToolbar } from "../components/toolbar/EditorToolbar";
import { BlockPalette } from "../components/palette/BlockPalette";
import { PipelineCanvas } from "../components/canvas/PipelineCanvas";
import { CanvasControls } from "../components/canvas/CanvasControls";
import { ExecutionPanel } from "../components/execution/ExecutionPanel";
import { SaveAsAssetDialog } from "../components/assets/SaveAsAssetDialog";
import { RunWorkflowPanel } from "../components/run/RunWorkflowPanel";
import { HelpButton } from "../components/canvas/HelpButton";
import { ExportPreviewModal } from "../components/export/ExportPreviewModal";
import { NodeTestModal } from "../components/run/NodeTestModal";
import { RunPanel } from "../components/run/RunPanel";
import { serializePipeline, exportPipeline, downloadAsFile } from "../lib/serialize";
import { startPipeline, stopPipeline, subscribeRun, type LogEntry } from "../lib/runtime-api";
import { loadCanvas, saveCanvas, loadRun, saveRun, clearRun } from "../lib/persist";
import { useNodeActivity } from "../lib/use-node-activity";
import { defaultNameForType, type WorkflowIOType } from "../components/canvas/IOTypes";
import { usePipelineNodes } from "../hooks/use-pipeline-nodes";
import { usePipelineCanvas } from "../hooks/use-pipeline-canvas";
import { usePipelineExecution } from "../hooks/use-pipeline-execution";
import { useSaveAsAsset } from "../hooks/use-save-as-asset";
import type { AnyAsset } from "../types/asset.types";
import type { BlockCategory } from "../types/block.types";

export default function PipelineEditorPage() {
  const pipelineId = "new";
  const navigate = (_path: string) => { console.log("nav:", _path); };

  const [pipelineName, setPipelineName] = useState("Untitled pipeline");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [hyperparams, setHyperparams] = useState<Record<string, string | number>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [builderAssistMode, setBuilderAssistMode] = useState<"manual" | "quick" | "auto">("auto");

  const [exportOpen, setExportOpen] = useState(false);
  const [exportCode, setExportCode] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

  // Per-node test
  const [testNodeId, setTestNodeId] = useState<string | null>(null);

  // Full-pipeline run
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<"idle" | "starting" | "running" | "stopped" | "exited" | "failed">("idle");
  const [runLogs, setRunLogs] = useState<LogEntry[]>([]);
  const [runPanelExpanded, setRunPanelExpanded] = useState(false);
  const { activity: nodeActivity, activeId: activeNodeId } = useNodeActivity(runLogs);

  // Workflow inputs (top Inputs canvas node) and outputs (bottom Outputs canvas node)
  const [workflowInputs, setWorkflowInputs] = useState<Array<{ id: string; name: string; type: WorkflowIOType }>>([
    { id: "in-1", name: "image", type: "image" },
  ]);
  const [workflowOutputs, setWorkflowOutputs] = useState<Array<{ id: string; name: string; type: WorkflowIOType }>>([
    { id: "out-1", name: "output", type: "image" },
  ]);

  // Positions of the Inputs and Outputs canvas cards (both draggable)
  const [inputsNodePos, setInputsNodePos] = useState({ x: 340, y: 40 });
  const [outputsNodePos, setOutputsNodePos] = useState({ x: 320, y: 400 });

  // Core state hooks
  const nodesApi = usePipelineNodes();
  const { nodes, edges, groups, addNode, addAssetNode, deleteNode, moveNode, updateNode, updateNodeConfig, updateNodeLabel, addEdge, deleteEdge, replaceState } = nodesApi;

  const canvas = usePipelineCanvas(
    (id, x, y) => {
      if (id === "io:inputs-node") setInputsNodePos({ x, y });
      else if (id === "io:outputs-node") setOutputsNodePos({ x, y });
      else moveNode(id, x, y);
    },
    (source, target, sp, tp) => addEdge(source, target, sp, tp),
  );

  const exec = usePipelineExecution();
  const { saveAsModel, saveAsTask } = useSaveAsAsset();

  // Hydrate canvas + run state from localStorage on mount (client-only)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = loadCanvas();
    if (saved) {
      setPipelineName(saved.name);
      replaceState({ nodes: saved.nodes, edges: saved.edges });
    }
    const savedRun = loadRun();
    if (savedRun) {
      setRunId(savedRun.runId);
      setRunStatus(savedRun.status as any);
      setRunLogs(savedRun.logs as any);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave canvas on every change (after hydration so we don't overwrite with [])
  useEffect(() => {
    if (!hydrated) return;
    saveCanvas({ name: pipelineName, nodes, edges });
  }, [hydrated, pipelineName, nodes, edges]);

  // Autosave run state on every change
  useEffect(() => {
    if (!hydrated) return;
    saveRun({ runId, status: runStatus, logs: runLogs.slice(-300) });
  }, [hydrated, runId, runStatus, runLogs]);

  const hasAnySelection = !!selectedId;
  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);

  // ── Handlers ───────────────────────────────────────────────
  const handleAddBlock = useCallback((type: string) => {
    const node = addNode(type);
    if (node) setSelectedId(node.id);
  }, [addNode]);

  const handleAddWorkflowInput = useCallback((name: string, type: WorkflowIOType) => {
    const id = `in-${Date.now()}`;
    setWorkflowInputs((prev) => {
      const cleanName = name?.trim() || defaultNameForType(type, prev.filter((p) => p.type === type).length);
      return [...prev, { id, name: cleanName, type }];
    });
  }, []);

  const handleRemoveWorkflowInput = useCallback((id: string) => {
    setWorkflowInputs((prev) => prev.filter((x) => x.id !== id));
    // Also purge edges that referenced this virtual input as a source
    const virtualId = `io:in:${id}`;
    edges.filter((e) => e.source === virtualId).forEach((e) => deleteEdge(e.id));
  }, [edges, deleteEdge]);

  const handleRenameWorkflowInput = useCallback((id: string, name: string) => {
    setWorkflowInputs((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  }, []);

  const handleAddWorkflowOutput = useCallback((name: string, type: WorkflowIOType) => {
    const id = `out-${Date.now()}`;
    setWorkflowOutputs((prev) => {
      const cleanName = name?.trim() || defaultNameForType(type, prev.filter((p) => p.type === type).length);
      return [...prev, { id, name: cleanName, type }];
    });
  }, []);

  const handleRemoveWorkflowOutput = useCallback((id: string) => {
    setWorkflowOutputs((prev) => prev.filter((x) => x.id !== id));
    // Purge edges that pointed to this virtual output as a target
    const virtualId = `io:out:${id}`;
    edges.filter((e) => e.target === virtualId).forEach((e) => deleteEdge(e.id));
  }, [edges, deleteEdge]);

  const handleRenameWorkflowOutput = useCallback((id: string, name: string) => {
    setWorkflowOutputs((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  }, []);


  const handleAddAsset = useCallback((asset: AnyAsset) => {
    // Custom assets render as Model-category composite blocks.
    const category: BlockCategory = "Model";
    const n = addAssetNode({ kind: asset.kind, assetId: asset.id, label: asset.name, category });
    setSelectedId(n.id);
  }, [addAssetNode]);

  const handleSaveAsAsset = useCallback(
    ({ kind, name, description, icon, taskType }: { kind: "model" | "task"; name: string; description: string; icon: string; taskType?: string }) => {
      const target = selected ? [selected] : nodes;
      const targetEdges = edges.filter(
        (e) => target.some((n) => n.id === e.source) && target.some((n) => n.id === e.target),
      );
      if (kind === "model") {
        const a = saveAsModel(target, targetEdges, { name, description, icon });
        toast.success(`Saved as model: ${a.name}`);
      } else {
        const a = saveAsTask(target, targetEdges, { name, description, icon, taskType: taskType as "detection" | "classification" | "segmentation" | "pose" | "ocr" | "tracking" | "counting" | "anomaly" | "custom" });
        toast.success(`Saved as task: ${a.name}`);
      }
      setSaveAsOpen(false);
    },
    [selected, nodes, edges, saveAsModel, saveAsTask],
  );

  const handleRun = useCallback(() => {
    exec.runPipeline(nodes);
  }, [exec, nodes]);

  const handleSave = useCallback(() => {
    toast.success(`"${pipelineName}" saved (${nodes.length} blocks)`);
  }, [pipelineName, nodes.length]);

  const handleExport = useCallback(async () => {
    if (nodes.length === 0) {
      toast.error("Add at least one block before exporting.");
      return;
    }
    setExportOpen(true);
    setExportCode("");
    setExportError(null);
    const pipeline = serializePipeline(pipelineName, nodes, edges);
    const res: any = await exportPipeline(backendUrl, pipeline);
    if (res.ok) setExportCode(res.code);
    else setExportError(res.error);
  }, [pipelineName, nodes, edges, backendUrl]);

  const handleDownloadGenerated = useCallback(() => {
    if (!exportCode) return;
    downloadAsFile("inference.py", exportCode);
    toast.success("inference.py downloaded");
  }, [exportCode]);

  const handleRunPipeline = useCallback(async () => {
    if (nodes.length === 0) {
      toast.error("Add blocks first.");
      return;
    }
    setRunStatus("starting");
    setRunLogs([]);
    setRunPanelExpanded(true);
    const pipeline = serializePipeline(pipelineName, nodes, edges);
    const res: any = await startPipeline(pipeline);
    if (res.error || !res.runId) {
      setRunStatus("failed");
      setRunLogs([{ time: Date.now(), stream: "stderr", line: res.error ?? "Failed to start" }]);
      toast.error(res.error ?? "Failed to start pipeline");
      return;
    }
    setRunId(res.runId);
    setRunStatus("running");
    toast.success("Pipeline running");
  }, [pipelineName, nodes, edges]);

  const handleStopPipeline = useCallback(async () => {
    if (!runId) return;
    await stopPipeline(runId);
    setRunStatus("stopped");
    toast("Pipeline stopped");
  }, [runId]);

  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return;
    if (!confirm(`Remove all ${nodes.length} block${nodes.length === 1 ? "" : "s"} from the canvas?`)) return;
    replaceState({ nodes: [], edges: [] });
    setSelectedId(null);
    toast.success("Canvas cleared");
  }, [nodes.length, replaceState]);

  // Subscribe to SSE log stream when runId is set
  useEffect(() => {
    if (!runId) return;
    const cleanup = subscribeRun(
      runId,
      (entry) => setRunLogs((prev) => [...prev.slice(-500), entry]),
      (status) => setRunStatus(status as any),
    );
    return cleanup;
  }, [runId]);

  const handleAutoLayout = useCallback(() => {
    const step = 220;
    nodes.forEach((n, i) => moveNode(n.id, 60 + i * step, 120));
  }, [nodes, moveNode]);

  const handleParamsChange = useCallback((key: string, value: string) => {
    setHyperparams((p) => ({ ...p, [key]: value }));
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-0">
      <EditorToolbar
        name={pipelineName}
        onNameChange={setPipelineName}
        onBack={() => navigate("/pipeline-builder/pipelines")}
        onAutoLayout={handleAutoLayout}
        onToggleExec={() => exec.setExecOpen(!exec.execOpen)}
        onRun={() => setRunPanelOpen(true)}
        onOpenRunPanel={() => setRunPanelOpen(true)}
        onSave={handleSave}
        onExport={handleExport}
        onRunPipeline={handleRunPipeline}
        onStopPipeline={handleStopPipeline}
        onClearCanvas={handleClearCanvas}
        runStatus={runStatus}
        onSaveAsAsset={() => setSaveAsOpen(true)}
        isRunning={exec.isRunning}
        hasSelection={hasAnySelection || nodes.length > 0}
        nodeCount={nodes.length}
        execOpen={exec.execOpen}
        hasUnsavedChanges={nodes.length > 0}
        alertCount={builderAssistMode === "manual" ? 0 : 2}
        builderAssistMode={builderAssistMode}
        onBuilderAssistChange={setBuilderAssistMode}
      />

      <div className="flex min-h-0 flex-1">
        <BlockPalette
          open={paletteOpen}
          onToggle={() => setPaletteOpen((v) => !v)}
          onAddBlock={(type) => { handleAddBlock(type); setPaletteOpen(false); }}
          onAddAsset={(asset) => { handleAddAsset(asset); setPaletteOpen(false); }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Canvas viewport — flexes; RunPanel below shrinks it when expanded */}
          <div className="relative min-h-0 flex-1">
          <PipelineCanvas
            ref={canvas.canvasRef}
            nodes={nodes}
            edges={edges}
            groups={groups}
            zoom={canvas.zoom}
            selectedId={selectedId}
            drawingEdge={canvas.drawingEdge}
            onSelect={setSelectedId}
            onDeleteNode={(id) => { deleteNode(id); if (selectedId === id) setSelectedId(null); }}
            onDeleteEdge={deleteEdge}
            onDragStart={canvas.startDragNode}
            onPortMouseDown={(id, port, x, y) => canvas.startDrawingEdge(id, port, x, y)}
            onPortMouseUp={(id, port) => canvas.completeDrawingEdge(id, port)}
            onMouseMove={canvas.handleMouseMove}
            onMouseUp={canvas.handleMouseUp}
            onLabelChange={updateNodeLabel}
            onConfigChange={updateNodeConfig}
            onConnectEdge={addEdge}
            emptyState={
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto max-w-md rounded-xl border border-dashed border-border bg-surface-1/80 px-6 py-5 text-center shadow-card backdrop-blur-sm">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">Start your pipeline</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    Click the <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">+</span> button on the left to add your first block.
                  </p>
                  <p className="mt-2 text-[11px] text-text-secondary">
                    Try: <strong>Input</strong> → <strong>Model</strong> → <strong>Event / Alert</strong>.
                  </p>
                  <button
                    onClick={() => setPaletteOpen(true)}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    Open block palette
                  </button>
                </div>
              </div>
            }
            workflowInputs={workflowInputs}
            workflowOutputs={workflowOutputs}
            onAddWorkflowInput={handleAddWorkflowInput}
            onRemoveWorkflowInput={handleRemoveWorkflowInput}
            onRenameWorkflowInput={handleRenameWorkflowInput}
            onAddWorkflowOutput={handleAddWorkflowOutput}
            onRemoveWorkflowOutput={handleRemoveWorkflowOutput}
            onRenameWorkflowOutput={handleRenameWorkflowOutput}
            inputsNodePos={inputsNodePos}
            outputsNodePos={outputsNodePos}
            onTestNode={(id) => setTestNodeId(id)}
            nodeActivity={nodeActivity}
            activeNodeId={activeNodeId}
          />
          <CanvasControls
            zoom={canvas.zoom}
            onZoomIn={canvas.zoomIn}
            onZoomOut={canvas.zoomOut}
            onZoomReset={canvas.zoomReset}
            onAutoLayout={handleAutoLayout}
          />
          <HelpButton onClick={() => toast("Shortcut help coming soon.")} />

          {exec.execOpen && (
            <ExecutionPanel
              tab={exec.execTab}
              setTab={exec.setExecTab}
              logs={exec.execLogs}
              nodes={nodes}
              params={hyperparams}
              onParamsChange={handleParamsChange}
              onClose={() => exec.setExecOpen(false)}
              isRunning={exec.isRunning}
            />
          )}
          </div>

          {/* RunPanel docks at the bottom of the canvas column — no longer overlaps controls */}
          <RunPanel
            expanded={runPanelExpanded}
            onToggle={() => setRunPanelExpanded((v) => !v)}
            status={runStatus}
            logs={runLogs}
            onClear={() => setRunLogs([])}
          />
        </div>

      </div>

      {testNodeId && (() => {
        const n = nodes.find((x) => x.id === testNodeId);
        if (!n) return null;
        // serialize this single node's config the same way the exporter does
        const ser = serializePipeline("test", [n], []);
        const cfg = ser.nodes[0]?.config ?? {};
        return (
          <NodeTestModal
            open={!!testNodeId}
            onClose={() => setTestNodeId(null)}
            nodeType={n.type}
            nodeLabel={n.label}
            config={cfg}
          />
        );
      })()}

      <ExportPreviewModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        code={exportCode}
        error={exportError}
        onDownload={handleDownloadGenerated}
      />

      <SaveAsAssetDialog open={saveAsOpen} onClose={() => setSaveAsOpen(false)} onSave={handleSaveAsAsset} />
      <RunWorkflowPanel
        open={runPanelOpen}
        onClose={() => setRunPanelOpen(false)}
        onRun={() => {
          setRunPanelOpen(false);
          handleRun();
        }}
        isRunning={exec.isRunning}
      />
    </div>
  );
}

export { PipelineEditorPage };
