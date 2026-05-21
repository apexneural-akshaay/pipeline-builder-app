/**
 * YOLO model catalog — single source of truth.
 *
 * Distilled from reference/yolo/*.md (which itself is scraped from docs.ultralytics.com).
 * Backend imports this directly to drive /models, /models/classes, /models/catalog
 * and the assembler's filename resolver. Keep numeric fields honest — if the docs
 * don't publish a value, leave it undefined rather than guessing.
 *
 * Scope: YOLO mainline only (v3, v5, v6, v7, v8, v9, v10, v11, v12, v26).
 * Non-YOLO loaders (NAS, World, YOLOE, RT-DETR, SAM/FastSAM/MobileSAM) are
 * intentionally excluded for now; they remain documented under reference/yolo/.
 */

import { IMAGENET_1K_CLASSES } from "./imagenet-classes";

// ─── Types ────────────────────────────────────────────────────────────────

export type TaskId = "detect" | "segment" | "classify" | "pose" | "obb";

export type DatasetId =
  | "COCO"
  | "COCO-seg"
  | "COCO-pose"
  | "DOTAv1"
  | "ImageNet-1k";

export type FamilyStatus =
  | "current"
  | "legacy"
  | "preview"
  | "inference-only"
  | "arch-only";

export interface CatalogVariant {
  /** Size letter as it appears in the filename (n/s/m/l/x/t/c/e/b/...). */
  size: string;
  /** Human-readable label (Nano / Small / Medium / Large / XLarge / Balanced / Tiny / Compact / Extended). */
  label: string;
  /** Exact .pt filename Ultralytics serves. */
  filename: string;
  /** Default inference input size in pixels. */
  input_size?: number;
  params_m?: number;
  flops_b?: number;
  /** COCO val mAP 50-95 for detect; mAP mask for segment; top-1 for classify; mAP 50 for OBB; mAP pose for pose. */
  map?: number;
  speed_cpu_ms?: number;
  speed_gpu_ms?: number;
  /** True if Ultralytics auto-downloads this filename on `YOLO("<file>")`. */
  downloadable: boolean;
  notes?: string;
}

export interface CatalogTask {
  id: TaskId;
  label: string;
  dataset: DatasetId;
  /** Variants for this (family, task), ordered smallest → largest. */
  variants: CatalogVariant[];
}

export interface CatalogFamily {
  /** Stable id used by the model picker. Matches the existing /models response. */
  id: string;
  label: string;
  released_year?: number;
  status: FamilyStatus;
  license: string;
  description: string;
  /** Status-level capability flags surfaced as badges in the UI. */
  nms_free?: boolean;
  /** Each family lists every supported task; arch-only / inference-only tasks are omitted from variants. */
  tasks: CatalogTask[];
}

export interface DatasetInfo {
  id: DatasetId;
  label: string;
  class_count: number;
  /** Empty array means the picker should fall back to freeform input. */
  classes: string[];
  is_freeform?: boolean;
  source?: string;
}

// ─── Datasets (drives /models/classes) ────────────────────────────────────

const COCO_CLASSES = [
  "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat","traffic light",
  "fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow",
  "elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee",
  "skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle",
  "wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange",
  "broccoli","carrot","hot dog","pizza","donut","cake","chair","couch","potted plant","bed",
  "dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone","microwave","oven",
  "toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush",
];

const DOTAV1_CLASSES = [
  "plane","ship","storage tank","baseball diamond","tennis court","basketball court",
  "ground track field","harbor","bridge","large vehicle","small vehicle",
  "helicopter","roundabout","soccer ball field","swimming pool",
];

export const DATASETS: Record<DatasetId, DatasetInfo> = {
  COCO: {
    id: "COCO",
    label: "COCO 2017 (80 classes)",
    class_count: 80,
    classes: COCO_CLASSES,
    source: "https://cocodataset.org",
  },
  "COCO-seg": {
    id: "COCO-seg",
    label: "COCO-seg (80 classes)",
    class_count: 80,
    classes: COCO_CLASSES,
    source: "https://cocodataset.org",
  },
  "COCO-pose": {
    id: "COCO-pose",
    label: "COCO-pose (1 class, 17 keypoints)",
    class_count: 1,
    classes: ["person"],
    source: "https://cocodataset.org/#keypoints-2017",
  },
  DOTAv1: {
    id: "DOTAv1",
    label: "DOTAv1 (15 aerial classes)",
    class_count: 15,
    classes: DOTAV1_CLASSES,
    source: "https://captain-whu.github.io/DOTA/",
  },
  "ImageNet-1k": {
    id: "ImageNet-1k",
    label: "ImageNet-1k (1000 classes)",
    class_count: 1000,
    classes: IMAGENET_1K_CLASSES,
    is_freeform: false,
    source: "https://www.image-net.org/",
  },
};

/** COCO-pose 17 keypoints (name + skeleton edges). Exposed for any UI that needs them. */
export const COCO_POSE_KEYPOINTS = [
  "nose","left_eye","right_eye","left_ear","right_ear",
  "left_shoulder","right_shoulder","left_elbow","right_elbow",
  "left_wrist","right_wrist","left_hip","right_hip",
  "left_knee","right_knee","left_ankle","right_ankle",
] as const;

export const COCO_POSE_SKELETON: ReadonlyArray<[number, number]> = [
  [15,13],[13,11],[16,14],[14,12],[11,12],
  [5,11],[6,12],[5,6],[5,7],[6,8],
  [7,9],[8,10],[1,2],[0,1],[0,2],
  [1,3],[2,4],[3,5],[4,6],
];

// ─── Helpers for building variants ────────────────────────────────────────

const SIZE_LABEL: Record<string, string> = {
  n: "Nano",
  s: "Small",
  m: "Medium",
  l: "Large",
  x: "XLarge",
  t: "Tiny",
  c: "Compact",
  e: "Extended",
  b: "Balanced",
};

function lbl(size: string): string {
  return SIZE_LABEL[size] ?? size.toUpperCase();
}

// ─── Catalog ──────────────────────────────────────────────────────────────

export const CATALOG: CatalogFamily[] = [
  // ────────── YOLOv3 ──────────
  {
    id: "yolov3",
    label: "YOLOv3",
    released_year: 2018,
    status: "legacy",
    license: "AGPL-3.0 / Enterprise",
    description:
      "Classic one-stage detector (Darknet-53) with Ultralytics anchor-free head (the 'u' re-trains). Legacy — use v8/v11 for new work.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "tiny", label: "Tiny",  filename: "yolov3-tinyu.pt", input_size: 640, downloadable: true },
          { size: "u",    label: "Base",  filename: "yolov3u.pt",      input_size: 640, downloadable: true },
          { size: "spp",  label: "SPP",   filename: "yolov3-sppu.pt",  input_size: 640, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLOv5 ──────────
  {
    id: "yolov5",
    label: "YOLOv5",
    released_year: 2020,
    status: "current",
    license: "AGPL-3.0 / Enterprise",
    description:
      "The most widely deployed YOLO. Ultralytics 'u' re-trains are anchor-free. 640-input and 1280-input (P6) series.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n",  label: lbl("n"), filename: "yolov5nu.pt",  input_size: 640,  params_m: 2.6,  flops_b: 7.7,   map: 34.3, downloadable: true },
          { size: "s",  label: lbl("s"), filename: "yolov5su.pt",  input_size: 640,  params_m: 9.1,  flops_b: 24.0,  map: 43.0, downloadable: true },
          { size: "m",  label: lbl("m"), filename: "yolov5mu.pt",  input_size: 640,  params_m: 25.1, flops_b: 64.2,  map: 49.0, downloadable: true },
          { size: "l",  label: lbl("l"), filename: "yolov5lu.pt",  input_size: 640,  params_m: 53.2, flops_b: 135.0, map: 52.2, downloadable: true },
          { size: "x",  label: lbl("x"), filename: "yolov5xu.pt",  input_size: 640,  params_m: 97.2, flops_b: 246.4, map: 53.2, downloadable: true },
          { size: "n6", label: "Nano (1280)",   filename: "yolov5n6u.pt", input_size: 1280, params_m: 4.3,   flops_b: 15.0,  map: 42.1, downloadable: true, notes: "1280-input P6 series" },
          { size: "s6", label: "Small (1280)",  filename: "yolov5s6u.pt", input_size: 1280, params_m: 15.3,  flops_b: 48.6,  map: 48.6, downloadable: true, notes: "1280-input P6 series" },
          { size: "m6", label: "Medium (1280)", filename: "yolov5m6u.pt", input_size: 1280, params_m: 41.2,  flops_b: 130.6, map: 53.6, downloadable: true, notes: "1280-input P6 series" },
          { size: "l6", label: "Large (1280)",  filename: "yolov5l6u.pt", input_size: 1280, params_m: 86.1,  flops_b: 271.4, map: 55.7, downloadable: true, notes: "1280-input P6 series" },
          { size: "x6", label: "XLarge (1280)", filename: "yolov5x6u.pt", input_size: 1280, params_m: 155.4, flops_b: 487.8, map: 56.8, downloadable: true, notes: "1280-input P6 series" },
        ],
      },
    ],
  },

  // ────────── YOLOv6 — arch-only, omitted from variants ──────────
  // (Ultralytics doesn't host .pt weights; we keep the family record for the
  //  /models/catalog endpoint but show no variants in the picker.)

  // ────────── YOLOv7 — inference-only, omitted ──────────

  // ────────── YOLOv8 ──────────
  {
    id: "yolov8",
    label: "YOLOv8",
    released_year: 2023,
    status: "current",
    license: "AGPL-3.0 / Enterprise",
    description:
      "Anchor-free, decoupled head, C2f neck. First Ultralytics YOLO supporting all five tasks out of the box.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolov8n.pt", input_size: 640, params_m: 3.2,  flops_b: 8.7,   map: 37.3, speed_cpu_ms: 80.4,  speed_gpu_ms: 0.99, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolov8s.pt", input_size: 640, params_m: 11.2, flops_b: 28.6,  map: 44.9, speed_cpu_ms: 128.4, speed_gpu_ms: 1.20, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolov8m.pt", input_size: 640, params_m: 25.9, flops_b: 78.9,  map: 50.2, speed_cpu_ms: 234.7, speed_gpu_ms: 1.83, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolov8l.pt", input_size: 640, params_m: 43.7, flops_b: 165.2, map: 52.9, speed_cpu_ms: 375.2, speed_gpu_ms: 2.39, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolov8x.pt", input_size: 640, params_m: 68.2, flops_b: 257.8, map: 53.9, speed_cpu_ms: 479.1, speed_gpu_ms: 3.53, downloadable: true },
        ],
      },
      {
        id: "segment",
        label: "Instance Segmentation",
        dataset: "COCO-seg",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolov8n-seg.pt", input_size: 640, params_m: 3.4,  flops_b: 12.6,  map: 30.5, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolov8s-seg.pt", input_size: 640, params_m: 11.8, flops_b: 42.6,  map: 36.8, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolov8m-seg.pt", input_size: 640, params_m: 27.3, flops_b: 110.2, map: 40.8, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolov8l-seg.pt", input_size: 640, params_m: 46.0, flops_b: 220.5, map: 42.6, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolov8x-seg.pt", input_size: 640, params_m: 71.8, flops_b: 344.1, map: 43.4, downloadable: true },
        ],
      },
      {
        id: "pose",
        label: "Pose Estimation",
        dataset: "COCO-pose",
        variants: [
          { size: "n",   label: lbl("n"),       filename: "yolov8n-pose.pt",    input_size: 640,  params_m: 3.3,  flops_b: 9.2,    map: 50.4, downloadable: true },
          { size: "s",   label: lbl("s"),       filename: "yolov8s-pose.pt",    input_size: 640,  params_m: 11.6, flops_b: 30.2,   map: 60.0, downloadable: true },
          { size: "m",   label: lbl("m"),       filename: "yolov8m-pose.pt",    input_size: 640,  params_m: 26.4, flops_b: 81.0,   map: 65.0, downloadable: true },
          { size: "l",   label: lbl("l"),       filename: "yolov8l-pose.pt",    input_size: 640,  params_m: 44.4, flops_b: 168.6,  map: 67.6, downloadable: true },
          { size: "x",   label: lbl("x"),       filename: "yolov8x-pose.pt",    input_size: 640,  params_m: 69.4, flops_b: 263.2,  map: 69.2, downloadable: true },
          { size: "x-p6",label: "XLarge (1280)",filename: "yolov8x-pose-p6.pt", input_size: 1280, params_m: 99.1, flops_b: 1066.4, map: 71.6, downloadable: true, notes: "1280-input P6 variant" },
        ],
      },
      {
        id: "classify",
        label: "Classification",
        dataset: "ImageNet-1k",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolov8n-cls.pt", input_size: 224, params_m: 2.7,  flops_b: 4.3,   map: 69.0, downloadable: true, notes: "Top-1 accuracy" },
          { size: "s", label: lbl("s"), filename: "yolov8s-cls.pt", input_size: 224, params_m: 6.4,  flops_b: 13.5,  map: 73.8, downloadable: true, notes: "Top-1 accuracy" },
          { size: "m", label: lbl("m"), filename: "yolov8m-cls.pt", input_size: 224, params_m: 17.0, flops_b: 42.7,  map: 76.8, downloadable: true, notes: "Top-1 accuracy" },
          { size: "l", label: lbl("l"), filename: "yolov8l-cls.pt", input_size: 224, params_m: 37.5, flops_b: 99.7,  map: 78.3, downloadable: true, notes: "Top-1 accuracy" },
          { size: "x", label: lbl("x"), filename: "yolov8x-cls.pt", input_size: 224, params_m: 57.4, flops_b: 154.8, map: 79.0, downloadable: true, notes: "Top-1 accuracy" },
        ],
      },
      {
        id: "obb",
        label: "Oriented Bounding Box",
        dataset: "DOTAv1",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolov8n-obb.pt", input_size: 1024, params_m: 3.1,  flops_b: 23.3,  map: 78.0, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolov8s-obb.pt", input_size: 1024, params_m: 11.4, flops_b: 76.3,  map: 79.5, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolov8m-obb.pt", input_size: 1024, params_m: 26.4, flops_b: 208.6, map: 80.5, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolov8l-obb.pt", input_size: 1024, params_m: 44.5, flops_b: 433.8, map: 80.7, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolov8x-obb.pt", input_size: 1024, params_m: 69.5, flops_b: 676.7, map: 81.4, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLOv9 ──────────
  {
    id: "yolov9",
    label: "YOLOv9",
    released_year: 2024,
    status: "current",
    license: "AGPL-3.0 / Enterprise",
    description:
      "Programmable Gradient Information (PGI) + GELAN backbone. Top end (e) is one of the most accurate sub-100M-param YOLOs.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "t", label: lbl("t"), filename: "yolov9t.pt", input_size: 640, params_m: 2.0,  flops_b: 7.7,   map: 38.3, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolov9s.pt", input_size: 640, params_m: 7.2,  flops_b: 26.7,  map: 46.8, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolov9m.pt", input_size: 640, params_m: 20.1, flops_b: 76.8,  map: 51.4, downloadable: true },
          { size: "c", label: lbl("c"), filename: "yolov9c.pt", input_size: 640, params_m: 25.5, flops_b: 102.8, map: 53.0, downloadable: true },
          { size: "e", label: lbl("e"), filename: "yolov9e.pt", input_size: 640, params_m: 58.1, flops_b: 192.5, map: 55.6, downloadable: true },
        ],
      },
      {
        id: "segment",
        label: "Instance Segmentation",
        dataset: "COCO-seg",
        variants: [
          { size: "c", label: lbl("c"), filename: "yolov9c-seg.pt", input_size: 640, params_m: 27.9, flops_b: 159.4, map: 42.4, downloadable: true },
          { size: "e", label: lbl("e"), filename: "yolov9e-seg.pt", input_size: 640, params_m: 60.5, flops_b: 248.4, map: 44.3, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLOv10 ──────────
  {
    id: "yolov10",
    label: "YOLOv10",
    released_year: 2024,
    status: "current",
    license: "AGPL-3.0",
    description:
      "First mainstream NMS-free YOLO. Consistent dual assignments — one-to-many head for training, one-to-one for inference.",
    nms_free: true,
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolov10n.pt", input_size: 640, params_m: 2.3,  flops_b: 6.7,   map: 39.5, speed_gpu_ms: 1.84,  downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolov10s.pt", input_size: 640, params_m: 7.2,  flops_b: 21.6,  map: 46.8, speed_gpu_ms: 2.49,  downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolov10m.pt", input_size: 640, params_m: 15.4, flops_b: 59.1,  map: 51.3, speed_gpu_ms: 4.74,  downloadable: true },
          { size: "b", label: lbl("b"), filename: "yolov10b.pt", input_size: 640, params_m: 19.1, flops_b: 92.0,  map: 52.5, speed_gpu_ms: 5.74,  downloadable: true, notes: "Balanced — between m and l" },
          { size: "l", label: lbl("l"), filename: "yolov10l.pt", input_size: 640, params_m: 24.4, flops_b: 120.3, map: 53.4, speed_gpu_ms: 7.28,  downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolov10x.pt", input_size: 640, params_m: 29.5, flops_b: 160.4, map: 54.4, speed_gpu_ms: 10.70, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLO11 ──────────
  {
    id: "yolo11",
    label: "YOLO11",
    released_year: 2024,
    status: "current",
    license: "AGPL-3.0 / Enterprise",
    description:
      "Successor to v8 across all five tasks. C3k2 + C2PSA backbone/neck. No 'v' in the filename.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo11n.pt", input_size: 640, params_m: 2.6,  flops_b: 6.5,   map: 39.5, speed_cpu_ms: 56.1,  speed_gpu_ms: 1.5,  downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo11s.pt", input_size: 640, params_m: 9.4,  flops_b: 21.5,  map: 47.0, speed_cpu_ms: 90.0,  speed_gpu_ms: 2.5,  downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo11m.pt", input_size: 640, params_m: 20.1, flops_b: 68.0,  map: 51.5, speed_cpu_ms: 183.2, speed_gpu_ms: 4.7,  downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo11l.pt", input_size: 640, params_m: 25.3, flops_b: 86.9,  map: 53.4, speed_cpu_ms: 238.6, speed_gpu_ms: 6.2,  downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo11x.pt", input_size: 640, params_m: 56.9, flops_b: 194.9, map: 54.7, speed_cpu_ms: 462.8, speed_gpu_ms: 11.3, downloadable: true },
        ],
      },
      {
        id: "segment",
        label: "Instance Segmentation",
        dataset: "COCO-seg",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo11n-seg.pt", input_size: 640, params_m: 2.9,  flops_b: 10.4,  map: 32.0, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo11s-seg.pt", input_size: 640, params_m: 10.1, flops_b: 35.5,  map: 37.8, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo11m-seg.pt", input_size: 640, params_m: 22.4, flops_b: 123.3, map: 41.5, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo11l-seg.pt", input_size: 640, params_m: 27.6, flops_b: 142.2, map: 42.9, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo11x-seg.pt", input_size: 640, params_m: 62.1, flops_b: 319.0, map: 43.8, downloadable: true },
        ],
      },
      {
        id: "pose",
        label: "Pose Estimation",
        dataset: "COCO-pose",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo11n-pose.pt", input_size: 640, params_m: 2.9,  flops_b: 7.6,   map: 50.0, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo11s-pose.pt", input_size: 640, params_m: 9.9,  flops_b: 23.2,  map: 58.9, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo11m-pose.pt", input_size: 640, params_m: 20.9, flops_b: 71.7,  map: 64.9, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo11l-pose.pt", input_size: 640, params_m: 26.2, flops_b: 90.7,  map: 66.1, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo11x-pose.pt", input_size: 640, params_m: 58.8, flops_b: 203.3, map: 69.5, downloadable: true },
        ],
      },
      {
        id: "classify",
        label: "Classification",
        dataset: "ImageNet-1k",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo11n-cls.pt", input_size: 224, params_m: 1.6,  flops_b: 3.3,   map: 70.0, downloadable: true, notes: "Top-1 accuracy" },
          { size: "s", label: lbl("s"), filename: "yolo11s-cls.pt", input_size: 224, params_m: 5.5,  flops_b: 12.1,  map: 75.4, downloadable: true, notes: "Top-1 accuracy" },
          { size: "m", label: lbl("m"), filename: "yolo11m-cls.pt", input_size: 224, params_m: 10.4, flops_b: 39.3,  map: 77.3, downloadable: true, notes: "Top-1 accuracy" },
          { size: "l", label: lbl("l"), filename: "yolo11l-cls.pt", input_size: 224, params_m: 12.9, flops_b: 49.4,  map: 78.3, downloadable: true, notes: "Top-1 accuracy" },
          { size: "x", label: lbl("x"), filename: "yolo11x-cls.pt", input_size: 224, params_m: 28.4, flops_b: 110.4, map: 79.5, downloadable: true, notes: "Top-1 accuracy" },
        ],
      },
      {
        id: "obb",
        label: "Oriented Bounding Box",
        dataset: "DOTAv1",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo11n-obb.pt", input_size: 1024, params_m: 2.7,  flops_b: 17.2,  map: 78.4, downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo11s-obb.pt", input_size: 1024, params_m: 9.7,  flops_b: 57.5,  map: 79.5, downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo11m-obb.pt", input_size: 1024, params_m: 20.9, flops_b: 183.5, map: 80.9, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo11l-obb.pt", input_size: 1024, params_m: 26.2, flops_b: 232.0, map: 81.0, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo11x-obb.pt", input_size: 1024, params_m: 58.8, flops_b: 520.2, map: 81.3, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLO12 ──────────
  {
    id: "yolo12",
    label: "YOLO12",
    released_year: 2025,
    status: "current",
    license: "AGPL-3.0",
    description:
      "Attention-centric YOLO — Area Attention + R-ELAN. Detection weights only; other tasks are architecture-only.",
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo12n.pt", input_size: 640, params_m: 2.6,  flops_b: 6.5,   map: 40.6, speed_gpu_ms: 1.64,  downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo12s.pt", input_size: 640, params_m: 9.3,  flops_b: 21.4,  map: 48.0, speed_gpu_ms: 2.61,  downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo12m.pt", input_size: 640, params_m: 20.2, flops_b: 67.5,  map: 52.5, speed_gpu_ms: 4.86,  downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo12l.pt", input_size: 640, params_m: 26.4, flops_b: 88.9,  map: 53.7, speed_gpu_ms: 6.77,  downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo12x.pt", input_size: 640, params_m: 59.1, flops_b: 199.0, map: 55.2, speed_gpu_ms: 11.79, downloadable: true },
        ],
      },
    ],
  },

  // ────────── YOLO26 ──────────
  {
    id: "yolo26",
    label: "YOLO26",
    released_year: 2026,
    status: "current",
    license: "AGPL-3.0 / Enterprise",
    description:
      "Latest Ultralytics flagship. NMS-free end-to-end, no DFL, dual-head, MuSGD optimizer. ~43% faster CPU vs YOLO11 at matched mAP.",
    nms_free: true,
    tasks: [
      {
        id: "detect",
        label: "Detection",
        dataset: "COCO",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo26n.pt", input_size: 640, params_m: 2.4,  flops_b: 5.4,   map: 40.9, speed_cpu_ms: 38.9,  downloadable: true },
          { size: "s", label: lbl("s"), filename: "yolo26s.pt", input_size: 640, params_m: 9.5,  flops_b: 20.7,  map: 48.6, speed_cpu_ms: 87.2,  downloadable: true },
          { size: "m", label: lbl("m"), filename: "yolo26m.pt", input_size: 640, params_m: 20.4, flops_b: 68.2,  map: 53.1, speed_cpu_ms: 220.0, downloadable: true },
          { size: "l", label: lbl("l"), filename: "yolo26l.pt", input_size: 640, params_m: 24.8, flops_b: 86.4,  map: 55.0, speed_cpu_ms: 286.2, downloadable: true },
          { size: "x", label: lbl("x"), filename: "yolo26x.pt", input_size: 640, params_m: 55.7, flops_b: 193.9, map: 57.5, speed_cpu_ms: 525.8, downloadable: true },
        ],
      },
      {
        id: "segment",
        label: "Instance Segmentation",
        dataset: "COCO-seg",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo26n-seg.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "s", label: lbl("s"), filename: "yolo26s-seg.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "m", label: lbl("m"), filename: "yolo26m-seg.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "l", label: lbl("l"), filename: "yolo26l-seg.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "x", label: lbl("x"), filename: "yolo26x-seg.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
        ],
      },
      {
        id: "pose",
        label: "Pose Estimation",
        dataset: "COCO-pose",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo26n-pose.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "s", label: lbl("s"), filename: "yolo26s-pose.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "m", label: lbl("m"), filename: "yolo26m-pose.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "l", label: lbl("l"), filename: "yolo26l-pose.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "x", label: lbl("x"), filename: "yolo26x-pose.pt", input_size: 640, downloadable: true, notes: "Per-variant metrics not yet published" },
        ],
      },
      {
        id: "classify",
        label: "Classification",
        dataset: "ImageNet-1k",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo26n-cls.pt", input_size: 224, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "s", label: lbl("s"), filename: "yolo26s-cls.pt", input_size: 224, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "m", label: lbl("m"), filename: "yolo26m-cls.pt", input_size: 224, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "l", label: lbl("l"), filename: "yolo26l-cls.pt", input_size: 224, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "x", label: lbl("x"), filename: "yolo26x-cls.pt", input_size: 224, downloadable: true, notes: "Per-variant metrics not yet published" },
        ],
      },
      {
        id: "obb",
        label: "Oriented Bounding Box",
        dataset: "DOTAv1",
        variants: [
          { size: "n", label: lbl("n"), filename: "yolo26n-obb.pt", input_size: 1024, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "s", label: lbl("s"), filename: "yolo26s-obb.pt", input_size: 1024, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "m", label: lbl("m"), filename: "yolo26m-obb.pt", input_size: 1024, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "l", label: lbl("l"), filename: "yolo26l-obb.pt", input_size: 1024, downloadable: true, notes: "Per-variant metrics not yet published" },
          { size: "x", label: lbl("x"), filename: "yolo26x-obb.pt", input_size: 1024, downloadable: true, notes: "Per-variant metrics not yet published" },
        ],
      },
    ],
  },
];

// ─── Lookup helpers (used by backend) ─────────────────────────────────────

const TASK_LABEL: Record<TaskId, string> = {
  detect: "Detection",
  segment: "Instance Segmentation",
  classify: "Classification",
  pose: "Pose Estimation",
  obb: "Oriented Bounding Box",
};

export function getTaskLabel(t: TaskId): string {
  return TASK_LABEL[t];
}

/** Find a family by id (e.g. "yolov8", "yolo11"). */
export function findFamily(versionId: string): CatalogFamily | undefined {
  return CATALOG.find((f) => f.id === versionId.toLowerCase());
}

/** Find a (family, task, size) variant. Returns undefined if any leg is missing. */
export function findVariant(
  versionId: string,
  taskId: string,
  size: string,
): CatalogVariant | undefined {
  const fam = findFamily(versionId);
  if (!fam) return undefined;
  const task = fam.tasks.find((t) => t.id === taskId.toLowerCase());
  if (!task) return undefined;
  return task.variants.find((v) => v.size === size.toLowerCase());
}

/**
 * Size-letter fallback used when the picker sends an older triple that
 * doesn't exist for the chosen family. Example: a saved canvas may carry
 * { version: "yolov9", size: "n" } from the old config — v9 has no "n",
 * it uses "t". This remap keeps legacy pipelines runnable.
 */
const SIZE_REMAP: Record<string, Record<string, string>> = {
  yolov9: { n: "t", l: "c" },
  yolov3: { n: "tiny", s: "tiny", m: "u", l: "u", x: "spp" },
};

export function remapSize(versionId: string, size: string): string {
  const m = SIZE_REMAP[versionId.toLowerCase()];
  if (!m) return size;
  return m[size.toLowerCase()] ?? size;
}

/** Resolve the canonical .pt filename for a (family, task, size). */
export function resolveFilename(
  versionId: string,
  taskId: string,
  size: string,
): string | undefined {
  const v = findVariant(versionId, taskId, size);
  if (v) return v.filename;
  // Try size remap (e.g. yolov9 n → t).
  const remapped = remapSize(versionId, size);
  if (remapped !== size) {
    const v2 = findVariant(versionId, taskId, remapped);
    if (v2) return v2.filename;
  }
  return undefined;
}

/** Look up the dataset a given filename was trained on. */
export function datasetForFilename(filename: string): DatasetInfo | undefined {
  for (const fam of CATALOG) {
    for (const task of fam.tasks) {
      if (task.variants.some((v) => v.filename === filename)) {
        return DATASETS[task.dataset];
      }
    }
  }
  return undefined;
}

/** Default dataset for a task, used as fallback for ?task= queries. */
export function defaultDatasetForTask(taskId: string): DatasetInfo | undefined {
  switch (taskId.toLowerCase()) {
    case "detect":   return DATASETS.COCO;
    case "segment":  return DATASETS["COCO-seg"];
    case "pose":     return DATASETS["COCO-pose"];
    case "obb":      return DATASETS.DOTAv1;
    case "classify": return DATASETS["ImageNet-1k"];
    default:         return undefined;
  }
}
