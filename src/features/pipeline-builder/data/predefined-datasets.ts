import type { DatasetAsset } from "../types/asset.types";

/** Platform-provided Dataset assets. Single output port so they wire cleanly into any Model. */
export const PREDEFINED_DATASETS: DatasetAsset[] = [
  {
    id: "dataset-ppe-v5",
    kind: "dataset",
    name: "PPE Compliance v5",
    description: "24,850 labeled frames · 12 classes · cleaned",
    icon: "👷",
    isBuiltIn: true,
    inputs: [],
    outputs: [{ name: "dataset", type: "dataset" }],
    metadata: { version: "v5.0", sampleCount: 24850, classCount: 12, splits: "80/15/5", format: "yolo", cleaned: true },
  },
  {
    id: "dataset-fire-smoke-v3",
    kind: "dataset",
    name: "Fire & Smoke v3",
    description: "8,400 frames · 2 classes · cleaned",
    icon: "🔥",
    isBuiltIn: true,
    inputs: [],
    outputs: [{ name: "dataset", type: "dataset" }],
    metadata: { version: "v3.0", sampleCount: 8400, classCount: 2, splits: "80/15/5", format: "yolo", cleaned: true },
  },
  {
    id: "dataset-defects-v2",
    kind: "dataset",
    name: "Surface Defects v2",
    description: "15,200 frames · 5 classes · cleaned",
    icon: "🔩",
    isBuiltIn: true,
    inputs: [],
    outputs: [{ name: "dataset", type: "dataset" }],
    metadata: { version: "v2.0", sampleCount: 15200, classCount: 5, splits: "80/15/5", format: "coco", cleaned: true },
  },
  {
    id: "dataset-imagenet-mini",
    kind: "dataset",
    name: "ImageNet-Mini",
    description: "100K frames · 1000 classes",
    icon: "🖼️",
    isBuiltIn: true,
    inputs: [],
    outputs: [{ name: "dataset", type: "dataset" }],
    metadata: { version: "v1.0", sampleCount: 100000, classCount: 1000, splits: "90/10", format: "imagenet", cleaned: true },
  },
];
