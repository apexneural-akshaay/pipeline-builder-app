# Tasks

Ultralytics models can be specialized to six tasks. Each task has its own head, loss, default dataset, and output type. This file lists what each task outputs, which dataset Ultralytics' pretrained weights are trained on, and which model families publish weights for it.

---

## detect

- **Output:** Axis-aligned bounding boxes + class IDs + confidence scores.
- **Default dataset:** COCO 2017 (80 classes).
- **Result fields:** `result.boxes` → `.xyxy`, `.xywh`, `.conf`, `.cls`.
- **Families with pretrained weights:**
  YOLOv3 (`u`), YOLOv5 (`u`), YOLOv8, YOLOv9, YOLOv10, YOLO11, YOLO12, YOLO26, YOLO-NAS, YOLO-World, YOLOE, RT-DETR.
- **Architecture-only:** YOLOv6 (YAMLs, weights from Meituan), YOLOv7 (export-only).

---

## segment

- **Output:** Bounding boxes + per-instance polygon masks (or rasterized masks).
- **Default dataset:** COCO-seg (80 classes).
- **Result fields:** `result.boxes` + `result.masks` → `.xy`, `.xyn`, `.data`.
- **Families with pretrained weights:**
  YOLOv8 (`-seg`), YOLOv9 (`c-seg`, `e-seg` only), YOLO11 (`-seg`), YOLO26 (`-seg`), YOLOE, SAM, SAM 2, FastSAM, MobileSAM.
- **Note:** SAM-family models are **promptable** segmenters — they do not predict class IDs.

---

## classify

- **Output:** Single class label + confidence (image-level).
- **Default dataset:** ImageNet-1k (1000 classes).
- **Default input size:** 224 (not 640).
- **Result fields:** `result.probs` → `.top1`, `.top5`, `.data`.
- **Families with pretrained weights:**
  YOLOv5-cls (original repo), YOLOv8 (`-cls`), YOLO11 (`-cls`), YOLO26 (`-cls`).

---

## pose

- **Output:** Bounding boxes + per-detection keypoints (x, y, visibility).
- **Default dataset:** COCO-pose. Single class `person`, 17 keypoints.
- **Result fields:** `result.keypoints` → `.xy`, `.xyn`, `.conf`.
- **Families with pretrained weights:**
  YOLOv8 (`-pose`, includes `yolov8x-pose-p6.pt` at 1280), YOLO11 (`-pose`), YOLO26 (`-pose`).

---

## obb (Oriented Bounding Box)

- **Output:** Rotated rectangles (cx, cy, w, h, θ) + class IDs + confidence.
- **Default dataset:** DOTAv1 (15 classes).
- **Default input size:** 1024 (tiles).
- **Result fields:** `result.obb` → `.xyxyxyxy`, `.xywhr`, `.cls`, `.conf`.
- **Families with pretrained weights:**
  YOLOv8 (`-obb`), YOLO11 (`-obb`), YOLO26 (`-obb`).

---

## track

- **What it is:** A *mode*, not a separate model. You take any detection/segmentation/pose model and call `model.track(...)` instead of `model.predict(...)`. The tracker associates detections across frames and adds a persistent `id` per object.
- **Output:** Per-frame detections + per-detection track ID (`result.boxes.id`).
- **Trackers available:** BoT-SORT (default), ByteTrack. See [tracking.md](./tracking.md).
- **Families that support tracking:** Every detection / segmentation / pose family above (the tracker is generic).

---

## open-vocabulary (special)

Not a separate Ultralytics "task" but worth listing: YOLO-World and YOLOE detect classes specified at inference time via text prompts (`model.set_classes([...])`). YOLOE also supports image prompts and prompt-free mode using its 1200+-category internal vocabulary. SAM 3 (newer, not in scope of every install) extends "promptable concept segmentation."

## Sources
- https://docs.ultralytics.com/tasks/
- https://docs.ultralytics.com/tasks/detect/
- https://docs.ultralytics.com/tasks/segment/
- https://docs.ultralytics.com/tasks/classify/
- https://docs.ultralytics.com/tasks/pose/
- https://docs.ultralytics.com/tasks/obb/
- https://docs.ultralytics.com/modes/track/
