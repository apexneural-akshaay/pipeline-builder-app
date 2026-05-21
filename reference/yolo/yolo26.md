# YOLO26

## Overview
- **Release year:** January 14, 2026.
- **Authors:** Ultralytics (Glenn Jocher, Jing Qiu).
- **Description:** Latest Ultralytics flagship. Built for edge deployment — NMS-free end-to-end, Distribution Focal Loss removed, dual-head architecture letting you trade speed vs. accuracy without re-training, and a new MuSGD optimizer combining SGD with Muon updates.
- **Status:** Current. Up to ~43% faster CPU inference than YOLO11 at comparable mAP per the docs.
- **License:** AGPL-3.0 and Enterprise.

## Tasks supported
- [x] detect
- [x] segment
- [x] classify
- [x] pose
- [x] obb
- [x] track
- [x] open-vocabulary (via the companion YOLOE-26 family — see [yoloe.md](./yoloe.md))

## Sizes / Variants

### Detection (COCO, 640)

| Variant | Filename       | Params (M) | FLOPs (B) | Input | mAP 50-95 | Speed CPU (ms) | Dataset |
|---------|----------------|-----------:|----------:|------:|----------:|---------------:|---------|
| n       | `yolo26n.pt`   | 2.4        | 5.4       | 640   | 40.9      | 38.9           | COCO    |
| s       | `yolo26s.pt`   | 9.5        | 20.7      | 640   | 48.6      | 87.2           | COCO    |
| m       | `yolo26m.pt`   | 20.4       | 68.2      | 640   | 53.1      | 220.0          | COCO    |
| l       | `yolo26l.pt`   | 24.8       | 86.4      | 640   | 55.0      | 286.2          | COCO    |
| x       | `yolo26x.pt`   | 55.7       | 193.9     | 640   | 57.5      | 525.8          | COCO    |

Segmentation, pose, OBB and classification variants exist across the same five sizes (n/s/m/l/x). Exact per-variant numbers for those tasks were not published on the docs page at fetch time.

## Filename convention
- Detect: `yolo26<size>.pt`
- Segment: `yolo26<size>-seg.pt`
- Pose: `yolo26<size>-pose.pt`
- Classify: `yolo26<size>-cls.pt`
- OBB: `yolo26<size>-obb.pt`
- Sizes: n, s, m, l, x. No "v".
- Open-vocab companion: `yoloe-26<size>.pt` (see [yoloe.md](./yoloe.md)).

## Pretrained datasets & class lists
- Detect / Segment → COCO 2017 (80 classes).
- Pose → COCO-pose.
- Classify → ImageNet-1k.
- OBB → DOTAv1.

## Features / Notable capabilities
- **End-to-end NMS-free** like v10 — no `iou` post-processing.
- **No DFL** — simpler, smaller box head.
- **Dual-head architecture** — switch between speed-optimized and accuracy-optimized inference modes at runtime, no retraining required.
- **MuSGD optimizer** — SGD + Muon hybrid, default for v26 training (set via `optimizer="MuSGD"`).
- ~43% faster CPU inference than YOLO11 at matched mAP (Ultralytics claim).
- Designed for edge deployment — works particularly well with ONNX/TFLite/NCNN exports.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).
`iou` and `agnostic_nms` have no effect (NMS-free).

## Train-time args worth surfacing in UI
Standard, plus:
- `optimizer="MuSGD"` is the recommended default.
- Standard augmentations apply. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- No formal paper at release — production-ready Ultralytics model.
- Confirm that your `ultralytics` package version supports v26 before assuming filenames.
- Numbers above are docs-derived; some segmentation/pose/cls/obb per-variant numbers were not yet published at fetch time and should be re-checked.

## Sources
- https://docs.ultralytics.com/models/yolo26/
