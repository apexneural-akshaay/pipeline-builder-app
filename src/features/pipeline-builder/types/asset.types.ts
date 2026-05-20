import type { PipelineNode, PipelineEdge } from "./block.types";

export type AssetKind = "model" | "task" | "dataset" | "metric";

export interface PortSpec {
  name: string;
  type: string;   // "frames" | "tensor" | "detections" | ...
  multi?: boolean;
}

export interface ComposableBlock {
  id: string;
  kind: AssetKind;
  name: string;
  description?: string;
  icon?: string;         // emoji or lucide name
  isBuiltIn: boolean;
  inputs: PortSpec[];
  outputs: PortSpec[];
  internals?: {
    nodes: PipelineNode[];
    edges: PipelineEdge[];
  };
  metadata?: Record<string, string | number | boolean | string[] | undefined>;
  createdAt?: string;
}

export interface ModelAsset extends ComposableBlock {
  kind: "model";
  metadata: {
    paramCount?: string;
    inputShape?: string;
    outputShape?: string;
    backbone?: string;
    taskCompat?: string[];
    trainingStatus?: "untrained" | "trained" | "fine-tuned";
    [k: string]: string | number | boolean | string[] | undefined;
  };
}

export interface TaskAsset extends ComposableBlock {
  kind: "task";
  metadata: {
    taskType:
      | "detection"
      | "classification"
      | "segmentation"
      | "pose"
      | "ocr"
      | "tracking"
      | "counting"
      | "anomaly"
      | "custom";
    requiredInputs: string[];
    producedOutputs: string[];
    [k: string]: string | number | boolean | string[] | undefined;
  };
}

export interface DatasetAsset extends ComposableBlock {
  kind: "dataset";
  metadata: {
    version: string;
    sampleCount: number;
    classCount: number;
    splits: string; // "80/15/5" – stored as string for simplicity
    format: "coco" | "yolo" | "imagenet" | "custom";
    [k: string]: string | number | boolean | string[] | undefined;
  };
}

export interface MetricAsset extends ComposableBlock {
  kind: "metric";
  metadata: {
    metricType: "detection" | "classification" | "segmentation" | "performance" | "custom";
    formula?: string;
    rangeMin?: number;
    rangeMax?: number;
    higherIsBetter: boolean;
    [k: string]: string | number | boolean | string[] | undefined;
  };
}

export type AnyAsset = ModelAsset | TaskAsset | DatasetAsset | MetricAsset;
