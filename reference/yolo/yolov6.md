# YOLOv6

## Overview
- **Release year:** 2022, by Meituan (Chuyi Li, Lulu Li, Yifei Geng et al.).
- **Description:** Industrial-grade detector developed for autonomous delivery robots. Introduces the BiC (Bi-directional Concatenation) neck module and anchor-aided training (AAT).
- **Status:** Available in the `ultralytics` package as architecture YAMLs. Ultralytics does not publish pretrained `.pt` weights — train from scratch or use Meituan's release.
- **License:** GPL-3.0 (Meituan's original release).

## Tasks supported
- [x] detect
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

| Variant | Filename / YAML  | Params (M) | FLOPs (B) | Input size | mAP / AP (COCO) | FPS (T4) | Dataset |
|---------|------------------|-----------:|----------:|-----------:|----------------:|---------:|---------|
| Nano    | `yolov6n.yaml`   | —          | —         | 640        | 37.5            | 1187     | COCO    |
| Small   | `yolov6s.yaml`   | —          | —         | 640        | 45.0            | 484      | COCO    |
| Medium  | `yolov6m.yaml`   | —          | —         | 640        | 50.0            | 226      | COCO    |
| Large   | `yolov6l.yaml`   | —          | —         | 640        | 52.8            | 116      | COCO    |
| XLarge  | `yolov6x.yaml`   | —          | —         | 640        | —               | —        | COCO    |

Numbers above come from the Meituan paper; Ultralytics' page lists them but does not host the corresponding `.pt` weights.

## Filename convention
- Architecture YAMLs: `yolov6<size>.yaml`, sizes ∈ {n, s, m, l, x}.
- A higher-resolution `yolov6l6` exists in Meituan's repo.
- No `-seg`, `-pose`, `-cls`, `-obb` from Ultralytics.

## Pretrained datasets & class lists
- COCO 2017 (80 classes).

## Features / Notable capabilities
- Bi-directional Concatenation (BiC) module in the neck.
- Anchor-Aided Training (AAT).
- Self-distillation pipeline in the paper.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- No Ultralytics-released `.pt`. To use pretrained weights, get them from Meituan's repo and convert.
- For new deployments, prefer YOLO11/26.

## Sources
- https://docs.ultralytics.com/models/yolov6/
- https://github.com/meituan/YOLOv6
