"use client";

import { useCallback } from "react";
import type { PipelineEdge, PipelineNode } from "../types/block.types";
import type { ModelAsset, PortSpec, TaskAsset } from "../types/asset.types";
import { useAssetsStore } from "../stores/assets.store";
import { findBlockDef } from "../data/block-catalog";

interface SaveParams {
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Derive input/output port specs for a subgraph by finding:
 *  - Inputs = block-inputs with no incoming edge in subgraph
 *  - Outputs = block-outputs with no outgoing edge in subgraph
 */
function deriveSubgraphPorts(nodes: PipelineNode[], edges: PipelineEdge[]) {
  const ids = new Set(nodes.map((n) => n.id));
  const internalEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  const inputs: PortSpec[] = [];
  const outputs: PortSpec[] = [];

  nodes.forEach((n) => {
    const def = findBlockDef(n.type);
    if (!def) return;

    const hasIncoming = internalEdges.some((e) => e.target === n.id);
    if (!hasIncoming) {
      def.inputs.forEach((portType, i) => {
        inputs.push({ name: `${n.label}:${portType}_${i}`, type: portType });
      });
    }

    const hasOutgoing = internalEdges.some((e) => e.source === n.id);
    if (!hasOutgoing) {
      def.outputs.forEach((portType, i) => {
        outputs.push({ name: `${n.label}:${portType}_${i}`, type: portType });
      });
    }
  });

  // Dedupe by (name + type)
  const dedupe = (arr: PortSpec[]) => {
    const seen = new Set<string>();
    return arr.filter((p) => {
      const k = `${p.name}|${p.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  return { inputs: dedupe(inputs), outputs: dedupe(outputs) };
}

export function useSaveAsAsset() {
  const addAsset = useAssetsStore((s) => s.addAsset);

  const saveAsModel = useCallback(
    (selectedNodes: PipelineNode[], selectedEdges: PipelineEdge[], params: SaveParams): ModelAsset => {
      const { inputs, outputs } = deriveSubgraphPorts(selectedNodes, selectedEdges);
      const id = `model-${Date.now()}`;
      const layerCount = selectedNodes.filter((n) => n.category === "Architecture" || n.category === "Heads").length;

      const asset: ModelAsset = {
        id,
        kind: "model",
        name: params.name,
        description: params.description,
        icon: params.icon ?? "ðŸ§ ",
        isBuiltIn: false,
        inputs,
        outputs,
        internals: { nodes: [...selectedNodes], edges: [...selectedEdges] },
        createdAt: new Date().toISOString(),
        metadata: {
          paramCount: `${layerCount} layers`,
          trainingStatus: "untrained",
        },
      };
      addAsset(asset);
      return asset;
    },
    [addAsset],
  );

  const saveAsTask = useCallback(
    (selectedNodes: PipelineNode[], selectedEdges: PipelineEdge[], params: SaveParams & { taskType?: TaskAsset["metadata"]["taskType"] }): TaskAsset => {
      const { inputs, outputs } = deriveSubgraphPorts(selectedNodes, selectedEdges);
      const id = `task-${Date.now()}`;

      const asset: TaskAsset = {
        id,
        kind: "task",
        name: params.name,
        description: params.description,
        icon: params.icon ?? "ðŸŽ¯",
        isBuiltIn: false,
        inputs,
        outputs,
        internals: { nodes: [...selectedNodes], edges: [...selectedEdges] },
        createdAt: new Date().toISOString(),
        metadata: {
          taskType: params.taskType ?? "custom",
          requiredInputs: inputs.map((p) => p.type),
          producedOutputs: outputs.map((p) => p.type),
        },
      };
      addAsset(asset);
      return asset;
    },
    [addAsset],
  );

  return { saveAsModel, saveAsTask };
}
