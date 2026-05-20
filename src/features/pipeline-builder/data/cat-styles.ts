import type { ComponentType } from "react";
import type { CatStyle, BlockCategory } from "../types/block.types";
import {
  Boxes, Image as ImageIcon, GitFork, Database, Bell,
  SlidersHorizontal, Binary, Clapperboard, Wrench,
  Factory, Code2,
} from "lucide-react";

/** Per-category style — node borders, edge colors, palette card accent. */
export const CAT_STYLES: Record<string, CatStyle> = {
  // Roboflow main 5
  Model:           { border: "#8b5cf6", iconBg: "#ede9fe", iconColor: "#8b5cf6", edgeColor: "#8b5cf6" },
  Visualization:   { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  LogicBranching:  { border: "#eab308", iconBg: "#fef9c3", iconColor: "#ca8a04", edgeColor: "#eab308" },
  DataStorage:     { border: "#0ea5e9", iconBg: "#e0f2fe", iconColor: "#0ea5e9", edgeColor: "#0ea5e9" },
  Notification:    { border: "#f97316", iconBg: "#ffedd5", iconColor: "#ea580c", edgeColor: "#f97316" },
  // Advanced 6
  Transformation:  { border: "#0d9488", iconBg: "#ccfbf1", iconColor: "#0d9488", edgeColor: "#0d9488" },
  ClassicalCV:     { border: "#0891b2", iconBg: "#cffafe", iconColor: "#0891b2", edgeColor: "#0891b2" },
  Video:           { border: "#6366f1", iconBg: "#e0e7ff", iconColor: "#6366f1", edgeColor: "#6366f1" },
  Advanced:        { border: "#64748b", iconBg: "#f1f5f9", iconColor: "#475569", edgeColor: "#64748b" },
  IndustrialIntegration: { border: "#b45309", iconBg: "#fef3c7", iconColor: "#b45309", edgeColor: "#b45309" },
  Custom:          { border: "#7c3aed", iconBg: "#ede9fe", iconColor: "#7c3aed", edgeColor: "#7c3aed" },

  // Legacy compat
  Inputs:          { border: "#10b981", iconBg: "#d1fae5", iconColor: "#059669", edgeColor: "#10b981" },
  Cameras:         { border: "#10b981", iconBg: "#d1fae5", iconColor: "#059669", edgeColor: "#10b981" },
  Triggers:        { border: "#14b8a6", iconBg: "#ccfbf1", iconColor: "#0f766e", edgeColor: "#14b8a6" },
  Prepare:         { border: "#0d9488", iconBg: "#ccfbf1", iconColor: "#0f766e", edgeColor: "#0d9488" },
  Models:          { border: "#8b5cf6", iconBg: "#ede9fe", iconColor: "#8b5cf6", edgeColor: "#8b5cf6" },
  Tasks:           { border: "#a855f7", iconBg: "#f3e8ff", iconColor: "#9333ea", edgeColor: "#a855f7" },
  Detect:          { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  Analytics:       { border: "#06b6d4", iconBg: "#cffafe", iconColor: "#0891b2", edgeColor: "#06b6d4" },
  Filters:         { border: "#f97316", iconBg: "#ffedd5", iconColor: "#ea580c", edgeColor: "#f97316" },
  Conditions:      { border: "#eab308", iconBg: "#fef9c3", iconColor: "#ca8a04", edgeColor: "#eab308" },
  Flow:            { border: "#64748b", iconBg: "#f1f5f9", iconColor: "#475569", edgeColor: "#64748b" },
  Branching:       { border: "#eab308", iconBg: "#fef9c3", iconColor: "#ca8a04", edgeColor: "#eab308" },
  Visualizations:  { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  Storage:         { border: "#0ea5e9", iconBg: "#e0f2fe", iconColor: "#0ea5e9", edgeColor: "#0ea5e9" },
  Notifications:   { border: "#f97316", iconBg: "#ffedd5", iconColor: "#ea580c", edgeColor: "#f97316" },
  Messaging:       { border: "#f43f5e", iconBg: "#ffe4e6", iconColor: "#e11d48", edgeColor: "#f43f5e" },
  Rendering:       { border: "#84cc16", iconBg: "#ecfccb", iconColor: "#65a30d", edgeColor: "#84cc16" },
  Transformations: { border: "#0d9488", iconBg: "#ccfbf1", iconColor: "#0d9488", edgeColor: "#0d9488" },
  // Even older legacy (from the pre-pipelinebuilder mock pipelines)
  Input:           { border: "#10b981", iconBg: "#d1fae5", iconColor: "#059669", edgeColor: "#10b981" },
  Sources:         { border: "#10b981", iconBg: "#d1fae5", iconColor: "#059669", edgeColor: "#10b981" },
  See:             { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  Detection:       { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  Recognition:     { border: "#2563eb", iconBg: "#dbeafe", iconColor: "#2563eb", edgeColor: "#2563eb" },
  Monitor:         { border: "#06b6d4", iconBg: "#cffafe", iconColor: "#0891b2", edgeColor: "#06b6d4" },
  Tracking:        { border: "#06b6d4", iconBg: "#cffafe", iconColor: "#0891b2", edgeColor: "#06b6d4" },
  Rules:           { border: "#f97316", iconBg: "#ffedd5", iconColor: "#ea580c", edgeColor: "#f97316" },
  Actions:         { border: "#f43f5e", iconBg: "#ffe4e6", iconColor: "#e11d48", edgeColor: "#f43f5e" },
  Alert:           { border: "#f43f5e", iconBg: "#ffe4e6", iconColor: "#e11d48", edgeColor: "#f43f5e" },
  Alerts:          { border: "#f43f5e", iconBg: "#ffe4e6", iconColor: "#e11d48", edgeColor: "#f43f5e" },
  Save:            { border: "#22c55e", iconBg: "#dcfce7", iconColor: "#16a34a", edgeColor: "#22c55e" },
  Persist:         { border: "#22c55e", iconBg: "#dcfce7", iconColor: "#16a34a", edgeColor: "#22c55e" },
  Display:         { border: "#84cc16", iconBg: "#ecfccb", iconColor: "#65a30d", edgeColor: "#84cc16" },
  Visualize:       { border: "#84cc16", iconBg: "#ecfccb", iconColor: "#65a30d", edgeColor: "#84cc16" },
  Transform:       { border: "#0d9488", iconBg: "#ccfbf1", iconColor: "#0d9488", edgeColor: "#0d9488" },
  Utilities:       { border: "#64748b", iconBg: "#f1f5f9", iconColor: "#475569", edgeColor: "#64748b" },
};

/** Icon shown on each category card in the palette. */
export const CATEGORY_ICON: Record<BlockCategory, ComponentType<{ className?: string }>> = {
  Model: Boxes,
  Visualization: ImageIcon,
  LogicBranching: GitFork,
  DataStorage: Database,
  Notification: Bell,
  Transformation: SlidersHorizontal,
  ClassicalCV: Wrench,
  Video: Clapperboard,
  Advanced: Binary,
  IndustrialIntegration: Factory,
  Custom: Code2,
};

export function catStyle(category: string): CatStyle {
  return CAT_STYLES[category] ?? { border: "#64748b", iconBg: "#f1f5f9", iconColor: "#475569", edgeColor: "#64748b" };
}
