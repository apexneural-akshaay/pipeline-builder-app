"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PipelineEdge, PipelineNode, PresetGroup } from "../../types/block.types";
import { GRID_SIZE, NODE_H, NODE_W } from "../../types/block.types";
import { catStyle } from "../../data/cat-styles";
import { findBlockDef } from "../../data/block-catalog";
import { useAssetsStore } from "../../stores/assets.store";
import { AnimatedEdge } from "./AnimatedEdge";
import { CanvasNode } from "./CanvasNode";
import { ExpandedNode } from "./ExpandedNode";
import { ArchGroupOutline } from "./ArchGroupOutline";
import { InputsNode, inputPortPosition, type WorkflowInput } from "./InputsNode";
import { OutputsNode, outputPortPosition, type WorkflowOutput } from "./OutputsNode";
import type { WorkflowIOType } from "./IOTypes";
import { ConnectInputCard, OutputSummaryCard } from "./ContextCards";
import type { DrawingEdge } from "../../hooks/use-pipeline-canvas";

interface Props {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  groups: PresetGroup[];
  zoom: number;
  selectedId: string | null;
  drawingEdge: DrawingEdge | null;
  onSelect: (id: string | null) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onDragStart: (id: string, node: PipelineNode, ev: React.MouseEvent) => void;
  onPortMouseDown: (id: string, port: number, x: number, y: number) => void;
  onPortMouseUp: (id: string, port: number) => void;
  onMouseMove: (ev: React.MouseEvent) => void;
  onMouseUp: () => void;
  onToggleGroup?: (groupId: string) => void;
  emptyState?: ReactNode;
  onLabelChange: (id: string, label: string) => void;
  onConfigChange: (id: string, key: string, value: string) => void;
  /** Create an edge from a source id -> this node's input port */
  onConnectEdge: (source: string, target: string, sourcePort?: number, targetPort?: number) => void;
  // Workflow I/O
  workflowInputs: WorkflowInput[];
  workflowOutputs: WorkflowOutput[];
  onAddWorkflowInput: (name: string, type: WorkflowIOType) => void;
  onRemoveWorkflowInput: (id: string) => void;
  onRenameWorkflowInput?: (id: string, name: string) => void;
  onAddWorkflowOutput: (name: string, type: WorkflowIOType) => void;
  onRemoveWorkflowOutput: (id: string) => void;
  onRenameWorkflowOutput?: (id: string, name: string) => void;
  inputsNodePos: { x: number; y: number };
  outputsNodePos: { x: number; y: number };
  /** Click-handler for the Run button on each node. */
  onTestNode?: (nodeId: string) => void;
  /** Per-node activity stats from heartbeats in the running pipeline. */
  nodeActivity?: Record<string, { frames?: number; detections?: number; passed?: number; fired?: number }>;
  /** The node whose heartbeat is most recent (within 2.5s). */
  activeNodeId?: string | null;
}

function getPortCount(
  node: PipelineNode,
  side: "in" | "out",
  assetsGetter: (id: string) => ReturnType<ReturnType<typeof useAssetsStore.getState>["getAsset"]>,
) {
  if (node.assetRef) {
    const a = assetsGetter(node.assetRef.id);
    if (a) return side === "in" ? a.inputs.length : a.outputs.length;
  }
  const def = findBlockDef(node.type);
  if (!def) return 0;
  return side === "in" ? def.inputs.length : def.outputs.length;
}

function portY(total: number, index: number) {
  if (total <= 0) return NODE_H / 2;
  return ((index + 1) / (total + 1)) * NODE_H;
}

export const PipelineCanvas = forwardRef<HTMLDivElement, Props>(function PipelineCanvas(
  {
    nodes, edges, groups, zoom, selectedId, drawingEdge,
    onSelect, onDeleteNode, onDeleteEdge, onDragStart, onPortMouseDown, onPortMouseUp, onMouseMove, onMouseUp, onToggleGroup, emptyState,
    onLabelChange, onConfigChange, onConnectEdge,
    workflowInputs, workflowOutputs,
    onAddWorkflowInput, onRemoveWorkflowInput, onRenameWorkflowInput,
    onAddWorkflowOutput, onRemoveWorkflowOutput, onRenameWorkflowOutput,
    inputsNodePos, outputsNodePos, onTestNode,
    nodeActivity, activeNodeId,
  },
  ref,
) {
  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const nodeById = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);
  const getAsset = useAssetsStore((s) => s.getAsset);
  const isEmpty = nodes.length === 0;

  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const panStateRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  // Center the viewport so freshly-added nodes (and restored localStorage state) are visible.
  // Re-runs when the first node appears (handles localStorage hydration after mount) and
  // uses ResizeObserver to catch the moment flex layout actually gives us a non-zero size.
  const hasCenteredRef = useRef(false);
  const firstNode = nodes[0];
  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    hasCenteredRef.current = false;  // allow re-centering when nodes change identity (e.g. hydration)
    const center = () => {
      if (hasCenteredRef.current) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const worldX = firstNode ? firstNode.x + NODE_W / 2 : 4000;
      const worldY = firstNode ? firstNode.y + NODE_H / 2 : 3000;
      el.scrollLeft = Math.max(0, worldX * zoom - w / 2);
      el.scrollTop = Math.max(0, worldY * zoom - h / 2);
      hasCenteredRef.current = true;
    };
    center();
    const ro = new ResizeObserver(center);
    ro.observe(el);
    return () => ro.disconnect();
  }, [firstNode?.id, zoom]);

  // â”€â”€ Virtual workflow I/O endpoint resolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Edges may reference "io:in:<id>" (Inputs node -> block) or "io:out:<id>" (block -> Outputs node).
  // Return {x,y,color} for the endpoint, or null if the id doesn't resolve.
  const resolveEndpoint = useCallback((id: string, side: "source" | "target"): { x: number; y: number; color: string } | null => {
    if (id.startsWith("io:in:")) {
      const inputId = id.slice(6);
      const idx = workflowInputs.findIndex((x) => x.id === inputId);
      if (idx < 0) return null;
      const { x, y } = inputPortPosition(inputsNodePos.x, inputsNodePos.y, idx);
      return { x, y, color: "#10b981" };
    }
    if (id.startsWith("io:out:")) {
      const outputId = id.slice(7);
      const idx = workflowOutputs.findIndex((x) => x.id === outputId);
      if (idx < 0) return null;
      const { x, y } = outputPortPosition(outputsNodePos.x, outputsNodePos.y, idx, workflowOutputs.length > 0);
      return { x, y, color: "#f43f5e" };
    }
    // Regular node
    const node = nodeById(id);
    if (!node) return null;
    const portCount = side === "source" ? getPortCount(node, "out", getAsset) : getPortCount(node, "in", getAsset);
    const port = 0; // default, per-edge port is resolved elsewhere
    const x = node.x + (side === "source" ? NODE_W : 0);
    const y = node.y + portY(portCount, port);
    return { x, y, color: catStyle(node.category).edgeColor };
  }, [workflowInputs, workflowOutputs, inputsNodePos, outputsNodePos, nodeById, getAsset]);

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`pipeline-canvas relative h-full w-full overflow-auto ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        background: "var(--surface-0)",
        backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)",
        backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
      }}
      onMouseDown={(e) => {
        // Start panning only when the click lands on empty canvas (not on a node/port/button/expanded card).
        const target = e.target as HTMLElement;
        const isInteractive = target.closest(
          "button, input, textarea, select, a, [data-node], [data-expanded-node], [data-workflow-io]",
        );
        // Left-click on empty space, OR middle-click anywhere = pan.
        const wantPan = (e.button === 0 && !isInteractive) || e.button === 1;
        if (!wantPan) return;
        const el = e.currentTarget;
        panStateRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };
        setIsPanning(true);
        e.preventDefault();
      }}
      onMouseMove={(e) => {
        if (panStateRef.current) {
          const el = e.currentTarget;
          el.scrollLeft = panStateRef.current.scrollLeft - (e.clientX - panStateRef.current.startX);
          el.scrollTop = panStateRef.current.scrollTop - (e.clientY - panStateRef.current.startY);
          return;
        }
        onMouseMove(e);
      }}
      onMouseUp={(e) => {
        if (panStateRef.current) {
          // Was the mouse essentially still? Treat as a click → fall through to onClick (deselect).
          const dx = Math.abs(e.clientX - panStateRef.current.startX);
          const dy = Math.abs(e.clientY - panStateRef.current.startY);
          panStateRef.current = null;
          setIsPanning(false);
          if (dx < 4 && dy < 4) {
            // Tiny movement — pretend it was a click on empty space
            onSelect(null);
            setSelectedEdgeId(null);
          }
          return;
        }
        onMouseUp();
      }}
      onMouseLeave={() => {
        if (panStateRef.current) {
          panStateRef.current = null;
          setIsPanning(false);
        }
      }}
      onClick={(e) => {
        // Collapse the expanded block if the click is on empty canvas (not on any interactive element).
        // Any real node/port/button handler stops propagation, so these clicks only reach here from empty space.
        // NOTE: when a pan happens onMouseUp swallows the click via the early return above.
        const target = e.target as HTMLElement;
        const isInteractive = target.closest("button, input, textarea, select, a, [data-node], [data-expanded-node], [data-workflow-io]");
        if (!isInteractive) {
          onSelect(null);
          setSelectedEdgeId(null);
        }
      }}
      onKeyDown={(e) => {
        if ((e.key === "Delete" || e.key === "Backspace") && selectedEdgeId) {
          onDeleteEdge(selectedEdgeId);
          setSelectedEdgeId(null);
        }
      }}
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(1000px circle at 50% 40%, transparent 0%, var(--surface-0) 80%)",
          opacity: 0.4,
        }}
      />

      <div
        className="relative"
        style={{
          width: "8000px",
          height: "6000px",
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {/* Inputs/Outputs IO cards intentionally removed — the user picks an Input block from the palette. */}

        {groups.map((g) => (
          <ArchGroupOutline key={g.id} group={g} nodes={nodes} onToggleCollapse={onToggleGroup} />
        ))}

        {/*
         * IMPORTANT: SVG layer needs pointer-events:none as a whole so it doesn't
         * block node clicks, but individual edge <g> elements opt into pointer-events:auto.
         */}
        <svg className="absolute inset-0 h-full w-full" style={{ overflow: "visible", pointerEvents: "none" }}>
          {edges.map((e) => {
            const src = resolveEndpoint(e.source, "source");
            const tgt = resolveEndpoint(e.target, "target");
            if (!src || !tgt) return null;
            // Override port Y if the endpoint is a regular node (resolveEndpoint uses port 0 by default)
            const sNode = nodeById(e.source);
            const tNode = nodeById(e.target);
            const sy = sNode ? sNode.y + portY(getPortCount(sNode, "out", getAsset), e.sourcePort ?? 0) : src.y;
            const ty = tNode ? tNode.y + portY(getPortCount(tNode, "in", getAsset), e.targetPort ?? 0) : tgt.y;
            const isHovered = hoveredEdgeId === e.id;
            const isSelected = selectedEdgeId === e.id;
            // Dim every other edge when one is in focus, or when a node is selected
            // and this edge is unrelated to it - keeps the graph readable at scale.
            const anyEdgeFocused = hoveredEdgeId !== null || selectedEdgeId !== null;
            const nodeFocusRelevant = !selectedId || e.source === selectedId || e.target === selectedId;
            const isDimmed =
              (anyEdgeFocused && !isHovered && !isSelected) ||
              (!anyEdgeFocused && !!selectedId && !nodeFocusRelevant);
            return (
              <AnimatedEdge
                key={e.id}
                x1={src.x}
                y1={sy}
                x2={tgt.x}
                y2={ty}
                color={src.color}
                hovered={isHovered}
                selected={isSelected}
                dimmed={isDimmed}
                onMouseEnter={() => setHoveredEdgeId(e.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onClick={() => setSelectedEdgeId(e.id)}
                onDelete={() => {
                  onDeleteEdge(e.id);
                  setSelectedEdgeId(null);
                  setHoveredEdgeId(null);
                }}
              />
            );
          })}
          {drawingEdge && (() => {
            const src = resolveEndpoint(drawingEdge.sourceId, "source");
            if (!src) return null;
            const sNode = nodeById(drawingEdge.sourceId);
            const sy = sNode ? sNode.y + portY(getPortCount(sNode, "out", getAsset), drawingEdge.sourcePort) : src.y;
            return (
              <AnimatedEdge
                x1={src.x}
                y1={sy}
                x2={drawingEdge.mouseX}
                y2={drawingEdge.mouseY}
                color={src.color}
                dashed
              />
            );
          })()}
        </svg>

        {/* Compact nodes for everything except the selected one */}
        {nodes.filter((n) => n.id !== selectedId).map((n) => (
          <CanvasNode
            key={n.id}
            node={n}
            selected={false}
            onSelect={(id) => {
              onSelect(id);
              setSelectedEdgeId(null);
            }}
            onDelete={onDeleteNode}
            onDragStart={onDragStart}
            onTestNode={onTestNode}
            onPortMouseDown={onPortMouseDown}
            onPortMouseUp={onPortMouseUp}
            activity={nodeActivity?.[n.id]}
            isActive={activeNodeId === n.id}
          />
        ))}

        {/* Context cards + Expanded inline settings card for the selected node */}
        {selectedNode && (
          <>
            <ConnectInputCard node={selectedNode} edges={edges} />
            <ExpandedNode
              node={selectedNode}
              edges={edges}
              allNodes={nodes}
              workflowInputs={workflowInputs}
              onClose={() => onSelect(null)}
              onDelete={() => onDeleteNode(selectedNode.id)}
              onLabelChange={(label) => onLabelChange(selectedNode.id, label)}
              onConfigChange={(k, v) => onConfigChange(selectedNode.id, k, v)}
              onStartDrag={(ev) => onDragStart(selectedNode.id, selectedNode, ev)}
              onPortMouseDown={(port, x, y) => onPortMouseDown(selectedNode.id, port, x, y)}
              onPortMouseUp={(port) => onPortMouseUp(selectedNode.id, port)}
              onConnectInput={(sourceId, targetPort, sourcePort) => onConnectEdge(sourceId, selectedNode.id, sourcePort ?? 0, targetPort)}
              onDisconnectInput={(edgeId) => onDeleteEdge(edgeId)}
            />
            <OutputSummaryCard node={selectedNode} />
          </>
        )}
      </div>

      {isEmpty && emptyState}
    </div>
  );
});
