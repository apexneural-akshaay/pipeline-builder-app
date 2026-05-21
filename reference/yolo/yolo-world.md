# YOLO-World

## Overview
- **Release year:** 2024.
- **Authors:** Tencent AI Lab Computer Vision Center.
- **Description:** Open-vocabulary detector built on the YOLOv8 backbone. You give it a list of class names (text prompts) at inference time and it detects them — no retraining needed. Pretrained on Objects365v1, GQA, and Flickr30k.
- **Status:** Current. Use when classes are unknown at training time.
- **License:** AGPL-3.0 (Ultralytics build).

## Tasks supported
- [x] detect (open-vocabulary)
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

| Variant   | Filename                  | Params (M) | mAP (COCO 50-95) | mAP50 | mAP75 | Dataset |
|-----------|---------------------------|-----------:|-----------------:|------:|------:|---------|
| s v1      | `yolov8s-world.pt`        | 12.7       | 37.7             | 52.2  | 41.0  | LVIS    |
| s v2      | `yolov8s-worldv2.pt`      | 12.7       | 37.7             | 52.2  | 41.0  | LVIS    |
| m v1/v2   | `yolov8m-world(v2).pt`    | 28.4       | 42.0             | 57.0  | 45.6  | LVIS    |
| l v1/v2   | `yolov8l-world(v2).pt`    | 46.8       | 45.7             | 61.3  | 49.4  | LVIS    |
| x v1/v2   | `yolov8x-world(v2).pt`    | 72.9       | 47.0             | 62.5  | 51.0  | LVIS    |

v2 variants are slight improvements on v1; same parameter count.

## Filename convention
- v1: `yolov8<size>-world.pt`
- v2: `yolov8<size>-worldv2.pt`
- `<size>` ∈ {s, m, l, x}. No `n`.
- Built on the YOLOv8 backbone, hence `yolov8` prefix.

## Pretrained datasets & class lists
- Pretrained on Objects365v1 + GQA + Flickr30k.
- Embedded vocabulary contains the COCO 80 classes by default — call `model.set_classes([...])` to swap.
- Evaluated on LVIS.

## Features / Notable capabilities
- **Open-vocabulary** — detect arbitrary classes via text prompt.
- `model.set_classes(["person", "bus", "yellow safety vest"])` rewrites the offline vocabulary embeddings; no retraining.
- "Prompt-then-detect" strategy — offline CLIP text embeddings keep inference fast.
- Outperforms MDETR and GLIP on zero-shot LVIS.

## Predict-time args worth surfacing in UI
Standard YOLO predict args, plus:
- **Custom classes:** `model.set_classes([...])` is the killer feature — expose this in the UI as a text-prompt list editor.

## Train-time args worth surfacing in UI
Fine-tuning is supported but advanced; expose only after `set_classes` flow is solid.

## Quirks / Gotchas
- Built on YOLOv8 — filenames are `yolov8*-world*.pt` not `yoloworld*.pt`.
- Calling `set_classes` and then exporting bakes the chosen classes into the ONNX/TRT model.
- Open-vocab quality depends heavily on prompt phrasing; show users that the prompts matter.
- For open-vocab + segmentation, see [yoloe.md](./yoloe.md).

## Sources
- https://docs.ultralytics.com/models/yolo-world/
- https://github.com/AILab-CVC/YOLO-World
