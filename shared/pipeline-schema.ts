export interface PipelineInput {
  type: "rtsp";
  url: string;
}

export interface PipelineNode {
  id: string;
  type: string;
  config: Record<string, string | number | boolean | string[]>;
}

export interface PipelineEdge {
  from: string;
  to: string;
}

export interface PipelineJson {
  schemaVersion: 1;
  name: string;
  input: PipelineInput;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export const SUPPORTED_BLOCK_TYPES = [
  "rtsp_source",
  "yolo_detect",
  "class_filter",
  "save_screenshot",
  "save_clip",
  "webhook",
] as const;

export type SupportedBlockType = (typeof SUPPORTED_BLOCK_TYPES)[number];

export interface BlockSpec {
  type: SupportedBlockType;
  label: string;
  requiredConfig: string[];
}

export const BLOCK_SPECS: BlockSpec[] = [
  { type: "rtsp_source",     label: "RTSP Source",     requiredConfig: ["url"] },
  { type: "yolo_detect",     label: "YOLO Detect",     requiredConfig: ["model", "confidence"] },
  { type: "class_filter",    label: "Class Filter",    requiredConfig: ["classes"] },
  { type: "save_screenshot", label: "Save Screenshot", requiredConfig: ["output_dir"] },
  { type: "save_clip",       label: "Save Clip",       requiredConfig: ["seconds", "output_dir"] },
  { type: "webhook",         label: "Webhook",         requiredConfig: ["url"] },
];
