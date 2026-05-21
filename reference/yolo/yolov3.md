# YOLOv3

## Overview
- **Release year:** Original YOLOv3 — 2018 (Joseph Redmon, Ali Farhadi). Ultralytics anchor-free re-train (`*u` variants) — added to the `ultralytics` package alongside v8.
- **Maintainer:** Ultralytics (Glenn Jocher).
- **Description:** A classic one-stage detector. Ultralytics re-implements the original Darknet-53 backbone but swaps in the v8-style anchor-free, objectness-free split head, hence the `u` suffix.
- **Status:** Legacy. Kept in the package for reproducibility and as a baseline.
- **License:** AGPL-3.0 and Enterprise.

## Tasks supported
- [x] detect
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track (any detect model can be tracked)

## Sizes / Variants

| Variant | Filename            | Params (M) | FLOPs (B) | Input size | mAP (val) | Speed CPU (ms) | Speed GPU (ms) | Dataset |
|---------|---------------------|-----------:|----------:|-----------:|----------:|---------------:|---------------:|---------|
| Tiny    | `yolov3-tinyu.pt`   | —          | —         | 640        | —         | —              | —              | COCO    |
| Base    | `yolov3u.pt`        | —          | —         | 640        | —         | —              | —              | COCO    |
| SPP     | `yolov3-sppu.pt`    | —          | —         | 640        | —         | —              | —              | COCO    |

The docs page lists the variants but does not publish updated benchmark numbers. Original Darknet YOLOv3 reported ~33 mAP on COCO; the `u` re-trains are higher but not formally published.

## Filename convention
- Tiny: `yolov3-tinyu.pt`
- Base: `yolov3u.pt`
- SPP head: `yolov3-sppu.pt`
- The `u` suffix denotes Ultralytics' anchor-free split head.
- No size letters (n/s/m/l/x). No `-seg`, `-pose`, `-cls`, or `-obb` variants.

## Pretrained datasets & class lists
- Trained on COCO 2017 — 80 classes. See [datasets.md](./datasets.md#coco-80-class-list).

## Features / Notable capabilities
- Anchor-free split head (Ultralytics modification).
- Darknet-53 backbone.
- ONNX / TensorRT / OpenVINO / CoreML / TFLite export supported.
- Tracking via BoT-SORT / ByteTrack.

## Predict-time args worth surfacing in UI
Standard YOLO predict args (see [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui)).

## Train-time args worth surfacing in UI
Standard YOLO train args (see [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui)).

## Quirks / Gotchas
- Strictly legacy — pick YOLOv8 or YOLO11 for new work.
- No segmentation/classification/pose variants exist in the Ultralytics package.

## Sources
- https://docs.ultralytics.com/models/yolov3/
- https://github.com/ultralytics/ultralytics
