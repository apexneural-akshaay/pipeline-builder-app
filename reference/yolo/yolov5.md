# YOLOv5

## Overview
- **Release year:** Original YOLOv5 — June 2020 by Ultralytics (Glenn Jocher). The "`u`" anchor-free re-trains documented here were created Nov 2023 inside the `ultralytics` package.
- **Maintainer:** Ultralytics.
- **Description:** The single most widely deployed YOLO. Anchor-free in the `*u` form, with a 640-input series and a 1280-input "P6" series for higher-resolution detection.
- **Status:** Mature / superseded by v8 and v11 but actively maintained.
- **License:** AGPL-3.0 and Enterprise.

## Tasks supported
- [x] detect (Ultralytics `*u` weights)
- [x] segment (original `ultralytics/yolov5` repo — `yolov5*-seg.pt`)
- [x] classify (original `ultralytics/yolov5` repo — `yolov5*-cls.pt`)
- [ ] pose
- [ ] obb
- [x] track

**Important:** The Ultralytics docs note: "YOLOv5 models trained by `ultralytics/yolov5` are not compatible with the `ultralytics` library." The anchor-free `*u.pt` files documented below are loadable by the modern `ultralytics` package; the older `*.pt` files are not.

## Sizes / Variants

### 640-input series (`yolov5*u.pt`)

| Variant | Filename       | Params (M) | FLOPs (B) | Input size | mAP (val) | Speed CPU (ms) | Speed GPU (ms) | Dataset |
|---------|----------------|-----------:|----------:|-----------:|----------:|---------------:|---------------:|---------|
| Nano    | `yolov5nu.pt`  | 2.6        | 7.7       | 640        | 34.3      | —              | —              | COCO    |
| Small   | `yolov5su.pt`  | 9.1        | 24.0      | 640        | 43.0      | —              | —              | COCO    |
| Medium  | `yolov5mu.pt`  | 25.1       | 64.2      | 640        | 49.0      | —              | —              | COCO    |
| Large   | `yolov5lu.pt`  | 53.2       | 135.0     | 640        | 52.2      | —              | —              | COCO    |
| XLarge  | `yolov5xu.pt`  | 97.2       | 246.4     | 640        | 53.2      | —              | —              | COCO    |

### 1280-input "P6" series (`yolov5*6u.pt`)

| Variant | Filename       | Params (M) | FLOPs (B) | Input size | mAP (val) | Dataset |
|---------|----------------|-----------:|----------:|-----------:|----------:|---------|
| n6      | `yolov5n6u.pt` | 4.3        | 15.0      | 1280       | 42.1      | COCO    |
| s6      | `yolov5s6u.pt` | 15.3       | 48.6      | 1280       | 48.6      | COCO    |
| m6      | `yolov5m6u.pt` | 41.2       | 130.6     | 1280       | 53.6      | COCO    |
| l6      | `yolov5l6u.pt` | 86.1       | 271.4     | 1280       | 55.7      | COCO    |
| x6      | `yolov5x6u.pt` | 155.4      | 487.8     | 1280       | 56.8      | COCO    |

Range stated in docs: 2.6M – 155.4M params, 34.3 – 56.8 mAP. Speed numbers not published per-variant on the docs page.

## Filename convention
- 640 series: `yolov5<size>u.pt` where `<size>` ∈ {n, s, m, l, x}
- 1280 series: `yolov5<size>6u.pt`
- Original (non-Ultralytics-trained, anchor-based) names: `yolov5<size>.pt`, `yolov5<size>-seg.pt`, `yolov5<size>-cls.pt` — these come from the standalone `ultralytics/yolov5` GitHub repo and are NOT loadable by `from ultralytics import YOLO`.

## Pretrained datasets & class lists
- COCO 2017 (80 classes) for detect.
- COCO-seg (80 classes) for original-repo segmentation weights.
- ImageNet-1k for original-repo classification weights.

## Features / Notable capabilities
- Two input resolutions (640 and 1280) — rare among YOLO families.
- Massive ecosystem (Roboflow, HuggingFace, ClearML, W&B integrations).
- Full export coverage.
- Tracking via BoT-SORT / ByteTrack.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- Two completely separate codebases share the "YOLOv5" name. `ultralytics/yolov5` is the historical repo; `ultralytics/ultralytics` re-implemented v5 with v8's head.
- Old `.pt` files from before the `u` re-train are not loadable in the new package.
- For segmentation / classification you must use the original repo.

## Sources
- https://docs.ultralytics.com/models/yolov5/
- https://github.com/ultralytics/yolov5
- https://github.com/ultralytics/ultralytics
