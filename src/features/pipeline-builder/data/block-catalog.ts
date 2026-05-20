import { Video, Brain, Filter, Bell } from "lucide-react";

import type { ArchBlockDef, BlockCategory, BlockDef } from "../types/block.types";

/* 4-block catalog matching backend snippets in pipeline-builder-app/backend/snippets/. */

const MODEL: BlockDef[] = [
  {
    type: "video_input",
    label: "Input",
    description: "RTSP stream or uploaded video file. Sets processing FPS.",
    category: "Model",
    icon: Video,
    inputs: [],
    outputs: ["image"],
    badges: ["popular"],
  },
  {
    type: "yolo_model",
    label: "Model",
    description: "YOLO model — pick version, task, size, classes, confidence.",
    category: "Model",
    icon: Brain,
    inputs: ["image"],
    outputs: ["detections"],
    badges: ["popular"],
  },
];

const LOGIC: BlockDef[] = [
  {
    type: "condition",
    label: "Condition",
    description: "Keep detections that match a class and meet a confidence threshold.",
    category: "LogicBranching",
    icon: Filter,
    inputs: ["detections"],
    outputs: ["detections"],
  },
];

const NOTIFICATION: BlockDef[] = [
  {
    type: "event_sink",
    label: "Event / Alert",
    description: "On event: save screenshot and/or 10s clip to local events folder.",
    category: "Notification",
    icon: Bell,
    inputs: ["detections"],
    outputs: [],
  },
];

const VISUALIZATION: BlockDef[] = [];
const DATA_STORAGE: BlockDef[] = [];
const TRANSFORMATION: BlockDef[] = [];
const CLASSICAL_CV: BlockDef[] = [];
const VIDEO: BlockDef[] = [];
const ADVANCED: BlockDef[] = [];
const INDUSTRIAL_INTEGRATION: BlockDef[] = [];
const CUSTOM: BlockDef[] = [];

export const BLOCK_CATALOG: Record<BlockCategory, (BlockDef | ArchBlockDef)[]> = {
  Model: MODEL,
  Visualization: VISUALIZATION,
  LogicBranching: LOGIC,
  DataStorage: DATA_STORAGE,
  Notification: NOTIFICATION,
  Transformation: TRANSFORMATION,
  ClassicalCV: CLASSICAL_CV,
  Video: VIDEO,
  Advanced: ADVANCED,
  IndustrialIntegration: INDUSTRIAL_INTEGRATION,
  Custom: CUSTOM,
};

export const ALL_PRIMITIVES: BlockDef[] = [...MODEL, ...LOGIC, ...NOTIFICATION];

export function findBlockDef(type: string): BlockDef | undefined {
  return ALL_PRIMITIVES.find((b) => b.type === type);
}

export function isArchBlock(_def: BlockDef | ArchBlockDef): _def is ArchBlockDef {
  return false;
}
