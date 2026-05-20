import type { LucideIcon } from "lucide-react";

/* ──────────────────────────────────────────
   Roboflow-aligned flat category structure
   5 main + 4 advanced (shown via "View All Blocks")
   ────────────────────────────────────────── */

export type BlockCategory =
  // Main 5 (shown by default)
  | "Model"
  | "Visualization"
  | "LogicBranching"
  | "DataStorage"
  | "Notification"
  // Advanced 6 (shown via "View All Blocks")
  | "Transformation"
  | "ClassicalCV"
  | "Video"
  | "Advanced"
  | "IndustrialIntegration"
  | "Custom";

export const MAIN_CATEGORIES: BlockCategory[] = [
  "Model",
  "Visualization",
  "LogicBranching",
  "DataStorage",
  "Notification",
];

export const ADVANCED_CATEGORIES: BlockCategory[] = [
  "Transformation",
  "ClassicalCV",
  "Video",
  "Advanced",
  "IndustrialIntegration",
  "Custom",
];

export const ALL_CATEGORIES: BlockCategory[] = [...MAIN_CATEGORIES, ...ADVANCED_CATEGORIES];

/** Display names (some have spaces/punctuation the enum key can't). */
export const CATEGORY_LABEL: Record<BlockCategory, string> = {
  Model: "Model",
  Visualization: "Visualization",
  LogicBranching: "Logic and Branching",
  DataStorage: "Data Storage",
  Notification: "Notification",
  Transformation: "Transformation",
  ClassicalCV: "Classical Computer Vision",
  Video: "Video",
  Advanced: "Advanced",
  IndustrialIntegration: "Industrial Integration",
  Custom: "Custom",
};

/** One-line description shown on each category card in the drill-in. */
export const CATEGORY_DESCRIPTION: Record<BlockCategory, string> = {
  Model: "Run a fine-tuned or foundational vision model.",
  Visualization: "Visualize the output of a model.",
  LogicBranching: "Control the flow of your workflow.",
  DataStorage: "Save data in a dataset or an external database.",
  Notification: "Send an alert, such as an SMS message or email.",
  Transformation: "Transform detections, images, or masks.",
  ClassicalCV: "Perform classical computer vision tasks, such as edge detection, template matching, and size measurement.",
  Video: "Tracking, motion, and video-specific analysis.",
  Advanced: "Leverage advanced features, such as pass/fail logic, data caching, and embedding similarity.",
  IndustrialIntegration: "Connect to industrial systems, PLCs, and IoT protocols for factory automation.",
  Custom: "Create custom blocks to perform any task that our default blocks don't support.",
};

/* ──────────────────────────────────────────
   Block definition
   ────────────────────────────────────────── */

export type BlockBadge = "popular" | "needs-gpu" | "in-development" | "new";

export interface BlockDef {
  type: string;
  label: string;
  description: string;
  category: BlockCategory;
  icon: LucideIcon;
  inputs: string[];
  outputs: string[];
  badges?: BlockBadge[];
}

export interface ArchBlockDef extends BlockDef {
  defaultChannels?: number;
  defaultDetails?: string;
  defaultSubLayers?: { name: string; params: string }[];
  defaultParams?: Record<string, string>;
  outputShape?: string;
}

/* ──────────────────────────────────────────
   Category styling
   ────────────────────────────────────────── */

export interface CatStyle {
  border: string;
  iconBg: string;
  iconColor: string;
  edgeColor: string;
}

/* ──────────────────────────────────────────
   Config field schema
   ────────────────────────────────────────── */

export interface ConfigField {
  key: string;
  label: string;
  /** Short help text shown below the label. */
  description?: string;
  placeholder?: string;
  type: "text" | "number" | "slider" | "select" | "toggle" | "password" | "textarea" | "video_source" | "model_picker" | "class_picker";
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  group?: string;
}

/* ──────────────────────────────────────────
   Canvas node / edge
   ────────────────────────────────────────── */

export interface PipelineNode {
  id: string;
  type: string;
  label: string;
  category: BlockCategory | string;
  x: number;
  y: number;
  config: Record<string, string>;
  archParams?: Record<string, string>;
  channels?: number;
  outputShape?: string;
  subLayers?: { name: string; params: string }[];
  presetGroupId?: string;
  assetRef?: { kind: "model" | "task" | "dataset" | "metric"; id: string };
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: number;
  targetPort?: number;
}

export interface PresetGroup {
  id: string;
  presetId: string;
  presetName: string;
  nodeIds: string[];
  collapsed: boolean;
  originX: number;
  originY: number;
}

/* ──────────────────────────────────────────
   Canvas constants
   ────────────────────────────────────────── */

export const NODE_W = 180;
export const NODE_H = 76;
export const GRID_SIZE = 20;
