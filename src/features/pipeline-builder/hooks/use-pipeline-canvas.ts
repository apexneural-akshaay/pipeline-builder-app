"use client";

import { useCallback, useRef, useState } from "react";
import type { PipelineNode } from "../types/block.types";
import { NODE_W, NODE_H } from "../types/block.types";

export interface DrawingEdge {
  sourceId: string;
  sourcePort: number;
  startX: number;
  startY: number;
  mouseX: number;
  mouseY: number;
}

export function usePipelineCanvas(onMove: (id: string, x: number, y: number) => void, onDropEdge: (source: string, target: string, sourcePort?: number, targetPort?: number) => void) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);

  const getCanvasPoint = useCallback((ev: { clientX: number; clientY: number }) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left + canvasRef.current.scrollLeft) / zoom,
      y: (ev.clientY - rect.top + canvasRef.current.scrollTop) / zoom,
    };
  }, [zoom]);

  const startDragNode = useCallback((nodeId: string, node: PipelineNode, ev: React.MouseEvent) => {
    const pt = getCanvasPoint(ev);
    setDraggingNodeId(nodeId);
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
  }, [getCanvasPoint]);

  const startDrawingEdge = useCallback((sourceId: string, sourcePort: number, startX: number, startY: number) => {
    setDrawingEdge({ sourceId, sourcePort, startX, startY, mouseX: startX, mouseY: startY });
  }, []);

  const completeDrawingEdge = useCallback((targetId: string, targetPort = 0) => {
    if (!drawingEdge) return;
    onDropEdge(drawingEdge.sourceId, targetId, drawingEdge.sourcePort, targetPort);
    setDrawingEdge(null);
  }, [drawingEdge, onDropEdge]);

  const cancelDrawingEdge = useCallback(() => setDrawingEdge(null), []);

  const handleMouseMove = useCallback((ev: React.MouseEvent) => {
    const pt = getCanvasPoint(ev);
    if (draggingNodeId) {
      onMove(draggingNodeId, pt.x - dragOffset.x, pt.y - dragOffset.y);
    } else if (drawingEdge) {
      setDrawingEdge({ ...drawingEdge, mouseX: pt.x, mouseY: pt.y });
    }
  }, [draggingNodeId, dragOffset, drawingEdge, getCanvasPoint, onMove]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setDrawingEdge(null);
  }, []);

  const getPortPos = useCallback((node: PipelineNode, kind: "in" | "out", _port = 0) => {
    const x = node.x + (kind === "out" ? NODE_W : 0);
    const y = node.y + NODE_H / 2;
    return { x, y };
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)));
  const zoomReset = () => setZoom(1);

  return {
    canvasRef,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomReset,
    draggingNodeId,
    drawingEdge,
    startDragNode,
    startDrawingEdge,
    completeDrawingEdge,
    cancelDrawingEdge,
    handleMouseMove,
    handleMouseUp,
    getPortPos,
    getCanvasPoint,
  };
}

export type UsePipelineCanvasReturn = ReturnType<typeof usePipelineCanvas>;
