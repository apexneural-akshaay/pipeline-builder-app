import {
  Image as ImageIcon, Film, Radio, Hash, Type as TypeIcon, ToggleLeft,
} from "lucide-react";
import type { ComponentType } from "react";

export type WorkflowIOType = "image" | "video" | "stream" | "number" | "string" | "boolean";

export interface IOTypeInfo {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

export const IO_TYPE_META: Record<WorkflowIOType, IOTypeInfo> = {
  image: {
    label: "Image",
    description: "A single frame / photo",
    icon: ImageIcon,
    accent: "#10b981",
  },
  video: {
    label: "Video",
    description: "An uploaded video file",
    icon: Film,
    accent: "#3b82f6",
  },
  stream: {
    label: "Stream",
    description: "Live RTSP / WebRTC stream",
    icon: Radio,
    accent: "#f97316",
  },
  number: {
    label: "Number",
    description: "Numeric parameter (float/int)",
    icon: Hash,
    accent: "#a855f7",
  },
  string: {
    label: "Text",
    description: "String parameter",
    icon: TypeIcon,
    accent: "#64748b",
  },
  boolean: {
    label: "Boolean",
    description: "True / false toggle",
    icon: ToggleLeft,
    accent: "#0891b2",
  },
};

export const IO_TYPES_ORDERED: WorkflowIOType[] = [
  "image", "video", "stream", "number", "string", "boolean",
];

export function defaultNameForType(type: WorkflowIOType, index: number): string {
  const base = {
    image: "image",
    video: "video",
    stream: "stream",
    number: "value",
    string: "text",
    boolean: "flag",
  }[type];
  return index === 0 ? base : `${base}_${index + 1}`;
}
