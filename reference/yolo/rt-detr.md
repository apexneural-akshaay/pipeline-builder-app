# RT-DETR (Baidu)

## Overview
- **Release year:** 2023. v2 in 2024.
- **Authors:** Wenyu Lv, Shangliang Xu, Yian Zhao, et al. — Baidu PaddlePaddle team.
- **Description:** Real-Time DEtection TRansformer. The first transformer detector that genuinely beats YOLOs in real-time settings. Combines a CNN backbone with a hybrid encoder (intra-scale interaction + cross-scale fusion) and a DETR-style decoder. NMS-free by design.
- **Status:** Current. Pick when transformer detectors fit your domain or when NMS-free decoder-style outputs are preferred.
- **License:** Apache-2.0 (Baidu upstream); AGPL-3.0 (Ultralytics integration).

## Tasks supported
- [x] detect
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

| Variant | Filename       | Params (M) | FLOPs (B) | Input | mAP 50-95 | FPS (T4) | Dataset |
|---------|----------------|-----------:|----------:|------:|----------:|---------:|---------|
| L       | `rtdetr-l.pt`  | 32.0       | 108.0     | 640   | 53.0      | 114      | COCO    |
| X       | `rtdetr-x.pt`  | 67.0       | 232.0     | 640   | 54.8      | 74       | COCO    |

There is also `rtdetr-r18`, `rtdetr-r34`, `rtdetr-r50`, `rtdetr-r101` in Baidu's upstream repo; the Ultralytics package exposes the `l` and `x` variants.

## Filename convention
- `rtdetr-l.pt`, `rtdetr-x.pt`.
- Lowercase `rtdetr`, hyphen, size letter.
- No `-seg`, `-pose`, `-cls`, `-obb`.
- Loaded via `from ultralytics import RTDETR; m = RTDETR("rtdetr-l.pt")`.

## Pretrained datasets & class lists
- COCO 2017 (80 classes).

## Features / Notable capabilities
- **Transformer-based** — DETR-style decoder with object queries.
- **NMS-free** — decoder produces one-to-one assignments.
- **Hybrid encoder** — intra-scale + cross-scale fusion, faster than vanilla DETR encoder.
- **Tunable decoder layers at inference** — change accuracy/speed trade-off without retraining.
- Strong on dense scenes where CNN inductive bias struggles.

## Predict-time args worth surfacing in UI
Standard predict args. `iou`/`agnostic_nms` are ignored (NMS-free).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui). DETR-style models can be more sensitive to LR scheduling — lower `lr0` is sometimes needed.

## Quirks / Gotchas
- Memory-hungrier than YOLOs at the same input size.
- Number of decoder queries (300 by default) caps total detections per image — bump it for very dense scenes.
- Use the `RTDETR` class, not `YOLO`, when loading.

## Sources
- https://docs.ultralytics.com/models/rtdetr/
- https://github.com/lyuwenyu/RT-DETR
