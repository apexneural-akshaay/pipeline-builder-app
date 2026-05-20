import type { ConfigField } from "../types/block.types";

/* Config fields per block type. Each entry's `key` corresponds to a placeholder
   in the matching backend snippet (backend/snippets/<type>.py). */

export const CONFIG_FIELDS: Record<string, ConfigField[]> = {
  video_input: [
    { key: "source", label: "Video Source", description: "RTSP URL or uploaded video file.", placeholder: "rtsp://192.168.1.10:554/ch1", type: "video_source", required: true },
    { key: "fps", label: "Processing FPS", description: "How many frames per second to send to the model.", placeholder: "5", type: "number", min: 1, max: 60, step: 1, required: true },
  ],

  yolo_model: [
    // Single cascading widget — reads /models, writes version/task/size/tracking.
    { key: "version", label: "Model", description: "Pick from models on disk in backend/models/.", type: "model_picker", required: true },
    { key: "classes", label: "Classes to track", description: "Pick from the model's class list. Leave empty to keep all.", type: "class_picker" },
    { key: "confidence", label: "Confidence threshold", description: "Drop predictions below this score.", placeholder: "0.5", type: "slider", min: 0, max: 1, step: 0.05, required: true },
  ],

  condition: [
    { key: "classes",        label: "Classes that trigger event", description: "Pick from the upstream model's class list. Blank = any class triggers.", type: "class_picker" },
    { key: "min_confidence", label: "Minimum confidence",         description: "Detections below this don't trigger.", placeholder: "0.7", type: "slider", min: 0, max: 1, step: 0.05, required: true },
  ],

  event_sink: [
    { key: "save_screenshot",  label: "Save screenshot",  description: "Write a JPG of the frame when event fires.", type: "toggle" },
    { key: "save_clip",        label: "Save 10s clip",    description: "Write an MP4 of the last N seconds.", type: "toggle" },
    { key: "clip_seconds",     label: "Clip length (seconds)", placeholder: "10", type: "number", min: 1, max: 60, step: 1 },
    { key: "clip_fps",         label: "Clip FPS",         placeholder: "15", type: "number", min: 1, max: 60, step: 1 },
    { key: "cooldown_seconds", label: "Cooldown (seconds)", description: "Minimum time between consecutive events.", placeholder: "5", type: "number", min: 0, max: 600, step: 1 },
    { key: "output_dir",       label: "Output folder",    description: "Where to write screenshots/clips on disk.", placeholder: "./events", type: "text", required: true },
  ],
};

export function getConfigFields(blockType: string): ConfigField[] {
  return CONFIG_FIELDS[blockType] ?? [];
}
