"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ArchBlockDef,
  BlockCategory,
  PipelineEdge,
  PipelineNode,
  PresetGroup,
} from "../types/block.types";
import { NODE_W, GRID_SIZE } from "../types/block.types";
import { findBlockDef, isArchBlock } from "../data/block-catalog";

function snap(v: number) {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

export function usePipelineNodes(initialNodes: PipelineNode[] = [], initialEdges: PipelineEdge[] = []) {
  const [nodes, setNodes] = useState<PipelineNode[]>(initialNodes);
  const [edges, setEdges] = useState<PipelineEdge[]>(initialEdges);
  const [groups, setGroups] = useState<PresetGroup[]>([]);
  const idRef = useRef(1);

  const nextId = useCallback((prefix = "node") => {
    const id = `${prefix}-${idRef.current++}`;
    return id;
  }, []);

  const addNode = useCallback(
    (type: string, x?: number, y?: number, labelOverride?: string) => {
      const def = findBlockDef(type);
      if (!def) return undefined;

      // Default position: right of rightmost node, else (40, 40)
      let nx = x, ny = y;
      if (nx === undefined || ny === undefined) {
        if (nodes.length === 0) {
          // World is 8000 x 6000; place the first node near the center so the
          // initial viewport (also centered) shows it immediately.
          nx = 4000 - NODE_W / 2;
          ny = 3000 - 40;
        } else {
          const rightmost = nodes.reduce((acc, n) => (n.x > acc.x ? n : acc), nodes[0]);
          nx = rightmost.x + NODE_W + 80;
          ny = rightmost.y;
        }
      }
      const snappedX = snap(nx!);
      const snappedY = snap(ny!);

      const arch: Partial<PipelineNode> = {};
      if (isArchBlock(def)) {
        const adef = def as ArchBlockDef;
        arch.channels = adef.defaultChannels;
        arch.outputShape = adef.outputShape;
        arch.subLayers = adef.defaultSubLayers;
        arch.archParams = adef.defaultParams;
      }

      const newNode: PipelineNode = {
        id: nextId(),
        type: def.type,
        label: labelOverride ?? def.label,
        category: def.category,
        x: snappedX,
        y: snappedY,
        config: {},
        ...arch,
      };
      setNodes((n) => [...n, newNode]);
      return newNode;
    },
    [nodes, nextId],
  );

  const addAssetNode = useCallback(
    (params: {
      kind: "model" | "task" | "dataset" | "metric";
      assetId: string;
      label: string;
      category: BlockCategory;
      x?: number;
      y?: number;
    }) => {
      let nx = params.x, ny = params.y;
      if (nx === undefined || ny === undefined) {
        if (nodes.length === 0) {
          // World is 8000 x 6000; place the first node near the center so the
          // initial viewport (also centered) shows it immediately.
          nx = 4000 - NODE_W / 2;
          ny = 3000 - 40;
        } else {
          const rightmost = nodes.reduce((acc, n) => (n.x > acc.x ? n : acc), nodes[0]);
          nx = rightmost.x + NODE_W + 80;
          ny = rightmost.y;
        }
      }
      const newNode: PipelineNode = {
        id: nextId(),
        type: `asset:${params.kind}:${params.assetId}`,
        label: params.label,
        category: params.category,
        x: snap(nx!),
        y: snap(ny!),
        config: {},
        assetRef: { kind: params.kind, id: params.assetId },
      };
      setNodes((n) => [...n, newNode]);
      return newNode;
    },
    [nodes, nextId],
  );

  const deleteNode = useCallback((id: string) => {
    setNodes((n) => n.filter((x) => x.id !== id));
    setEdges((e) => e.filter((x) => x.source !== id && x.target !== id));
    setGroups((g) => g.map((gg) => ({ ...gg, nodeIds: gg.nodeIds.filter((nid) => nid !== id) })).filter((gg) => gg.nodeIds.length > 0));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x: snap(x), y: snap(y) } : n)));
  }, []);

  const updateNode = useCallback((id: string, patch: Partial<PipelineNode>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const updateNodeConfig = useCallback((id: string, key: string, value: string) => {
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n)),
    );
  }, []);

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, label } : n)));
  }, []);

  const addEdge = useCallback((source: string, target: string, sourcePort = 0, targetPort = 0) => {
    if (source === target) return;
    setEdges((es) => {
      const exists = es.some((e) => e.source === source && e.target === target);
      if (exists) return es;
      return [...es, { id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, source, target, sourcePort, targetPort }];
    });
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setEdges((es) => es.filter((e) => e.id !== id));
  }, []);

  const addPresetSubgraph = useCallback(
    (newNodes: PipelineNode[], newEdges: PipelineEdge[], group?: PresetGroup) => {
      setNodes((ns) => [...ns, ...newNodes]);
      setEdges((es) => [...es, ...newEdges]);
      if (group) setGroups((gs) => [...gs, group]);
    },
    [],
  );

  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setGroups([]);
  }, []);

  return {
    nodes,
    edges,
    groups,
    setNodes,
    setEdges,
    setGroups,
    nextId,
    addNode,
    addAssetNode,
    deleteNode,
    moveNode,
    updateNode,
    updateNodeConfig,
    updateNodeLabel,
    addEdge,
    deleteEdge,
    addPresetSubgraph,
    clear,
    /** Hydrate canvas from a saved snapshot (e.g. localStorage). Also bumps the id counter
     *  past the highest existing node so freshly-added nodes don't collide. */
    replaceState: (next: { nodes: PipelineNode[]; edges: PipelineEdge[] }) => {
      setNodes(next.nodes);
      setEdges(next.edges);
      let maxId = 0;
      for (const n of next.nodes) {
        const m = /(\d+)$/.exec(n.id);
        if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
      }
      idRef.current = maxId + 1;
    },
  };
}

export type UsePipelineNodesReturn = ReturnType<typeof usePipelineNodes>;
