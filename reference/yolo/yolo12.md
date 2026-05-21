# YOLO12

## Overview
- **Release year:** Early 2025.
- **Authors:** Yunjie Tian, Qixiang Ye, David Doermann (University at Buffalo / UCAS).
- **Description:** Attention-centric YOLO — replaces standard CNN blocks with efficient area attention, while keeping real-time inference. Filename drops the "v" like YOLO11.
- **Status:** Current. Detection weights published; other tasks shipped as architectures only.
- **License:** AGPL-3.0.

## Tasks supported
- [x] detect
- [~] segment (architecture only, no Ultralytics-released `.pt`)
- [~] classify (architecture only)
- [~] pose (architecture only)
- [~] obb (architecture only)
- [x] track

## Sizes / Variants (Detection)

| Variant | Filename       | Params (M) | FLOPs (B) | Input | mAP 50-95 | Speed T4 TRT (ms) | Dataset |
|---------|----------------|-----------:|----------:|------:|----------:|------------------:|---------|
| n       | `yolo12n.pt`   | 2.6        | 6.5       | 640   | 40.6      | 1.64              | COCO    |
| s       | `yolo12s.pt`   | 9.3        | 21.4      | 640   | 48.0      | 2.61              | COCO    |
| m       | `yolo12m.pt`   | 20.2       | 67.5      | 640   | 52.5      | 4.86              | COCO    |
| l       | `yolo12l.pt`   | 26.4       | 88.9      | 640   | 53.7      | 6.77              | COCO    |
| x       | `yolo12x.pt`   | 59.1       | 199.0     | 640   | 55.2      | 11.79             | COCO    |

CPU ONNX speeds were not published in the docs page.

## Filename convention
- Detect: `yolo12<size>.pt`
- Segment / pose / cls / obb: architectures exist as `yolo12<size>-seg.yaml` etc., but **no pretrained `.pt` is hosted by Ultralytics** at time of writing. Training from scratch is supported.
- Sizes: n, s, m, l, x. No "v" in the filename.

## Pretrained datasets & class lists
- COCO 2017 (80 classes) for detect.

## Features / Notable capabilities
- Area Attention module — efficient self-attention with linear complexity.
- R-ELAN aggregation.
- FlashAttention support for training and inference.
- Best raw mAP among small YOLOs at release.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- For non-detect tasks you must train from scratch; no pretrained checkpoints.
- FlashAttention installation is recommended for speed; otherwise falls back to plain attention.
- "No v" naming — same gotcha as YOLO11.

## Sources
- https://docs.ultralytics.com/models/yolo12/
- https://github.com/sunsmarterjie/yolov12
