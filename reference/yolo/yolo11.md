# YOLO11

## Overview
- **Release year:** September 30, 2024.
- **Authors:** Ultralytics (Glenn Jocher, Jing Qiu et al.).
- **Description:** Successor to YOLOv8 across all five tasks. Improved backbone/neck (C3k2, SPPF, C2PSA partial-self-attention) for better mAP per FLOP. **Note: Ultralytics dropped the "v" — filenames are `yolo11<size>...` (not `yolov11`).**
- **Status:** Current default for new projects.
- **License:** AGPL-3.0 and Enterprise.

## Tasks supported
- [x] detect
- [x] segment
- [x] classify
- [x] pose
- [x] obb
- [x] track

## Sizes / Variants

### Detection (COCO, 640)

| Variant | Filename       | Params (M) | FLOPs (B) | mAP 50-95 | Speed CPU ONNX (ms) | Speed T4 TRT (ms) | Dataset |
|---------|----------------|-----------:|----------:|----------:|--------------------:|------------------:|---------|
| n       | `yolo11n.pt`   | 2.6        | 6.5       | 39.5      | 56.1 ± 0.8          | 1.5 ± 0.0         | COCO    |
| s       | `yolo11s.pt`   | 9.4        | 21.5      | 47.0      | 90.0 ± 1.2          | 2.5 ± 0.0         | COCO    |
| m       | `yolo11m.pt`   | 20.1       | 68.0      | 51.5      | 183.2 ± 2.0         | 4.7 ± 0.1         | COCO    |
| l       | `yolo11l.pt`   | 25.3       | 86.9      | 53.4      | 238.6 ± 1.4         | 6.2 ± 0.1         | COCO    |
| x       | `yolo11x.pt`   | 56.9       | 194.9     | 54.7      | 462.8 ± 6.7         | 11.3 ± 0.2        | COCO    |

### Segmentation (COCO-seg)

| Variant | Filename            | Params (M) | FLOPs (B) | mAP box | mAP mask | Dataset  |
|---------|---------------------|-----------:|----------:|--------:|---------:|----------|
| n       | `yolo11n-seg.pt`    | 2.9        | 10.4      | 38.9    | 32.0     | COCO-seg |
| s       | `yolo11s-seg.pt`    | 10.1       | 35.5      | 46.6    | 37.8     | COCO-seg |
| m       | `yolo11m-seg.pt`    | 22.4       | 123.3     | 51.5    | 41.5     | COCO-seg |
| l       | `yolo11l-seg.pt`    | 27.6       | 142.2     | 53.4    | 42.9     | COCO-seg |
| x       | `yolo11x-seg.pt`    | 62.1       | 319.0     | 54.7    | 43.8     | COCO-seg |

### Pose (COCO-pose, 17 keypoints)

| Variant | Filename            | Params (M) | FLOPs (B) | mAP pose | Dataset   |
|---------|---------------------|-----------:|----------:|---------:|-----------|
| n       | `yolo11n-pose.pt`   | 2.9        | 7.6       | 50.0     | COCO-pose |
| s       | `yolo11s-pose.pt`   | 9.9        | 23.2      | 58.9     | COCO-pose |
| m       | `yolo11m-pose.pt`   | 20.9       | 71.7      | 64.9     | COCO-pose |
| l       | `yolo11l-pose.pt`   | 26.2       | 90.7      | 66.1     | COCO-pose |
| x       | `yolo11x-pose.pt`   | 58.8       | 203.3     | 69.5     | COCO-pose |

### Classification (ImageNet-1k, 224)

| Variant | Filename            | Params (M) | FLOPs (B) @224 | Top-1 | Top-5 | Dataset     |
|---------|---------------------|-----------:|---------------:|------:|------:|-------------|
| n       | `yolo11n-cls.pt`    | 1.6        | 3.3            | 70.0  | 89.4  | ImageNet-1k |
| s       | `yolo11s-cls.pt`    | 5.5        | 12.1           | 75.4  | 92.7  | ImageNet-1k |
| m       | `yolo11m-cls.pt`    | 10.4       | 39.3           | 77.3  | 93.9  | ImageNet-1k |
| l       | `yolo11l-cls.pt`    | 12.9       | 49.4           | 78.3  | 94.3  | ImageNet-1k |
| x       | `yolo11x-cls.pt`    | 28.4       | 110.4          | 79.5  | 94.9  | ImageNet-1k |

### OBB (DOTAv1, 1024)

| Variant | Filename            | Params (M) | FLOPs (B) | mAP 50 | Dataset |
|---------|---------------------|-----------:|----------:|-------:|---------|
| n       | `yolo11n-obb.pt`    | 2.7        | 17.2      | 78.4   | DOTAv1  |
| s       | `yolo11s-obb.pt`    | 9.7        | 57.5      | 79.5   | DOTAv1  |
| m       | `yolo11m-obb.pt`    | 20.9       | 183.5     | 80.9   | DOTAv1  |
| l       | `yolo11l-obb.pt`    | 26.2       | 232.0     | 81.0   | DOTAv1  |
| x       | `yolo11x-obb.pt`    | 58.8       | 520.2     | 81.3   | DOTAv1  |

## Filename convention
- Detect: `yolo11<size>.pt`
- Segment: `yolo11<size>-seg.pt`
- Pose: `yolo11<size>-pose.pt`
- Classify: `yolo11<size>-cls.pt`
- OBB: `yolo11<size>-obb.pt`
- Sizes: n, s, m, l, x
- **Critical irregularity vs v8/v9/v10: no "v" in the filename.**

## Pretrained datasets & class lists
- Detect / Segment → COCO 2017 (80 classes) — [datasets.md](./datasets.md#coco-80-class-list).
- Pose → COCO-pose (person, 17 keypoints).
- Classify → ImageNet-1k (1000 classes).
- OBB → DOTAv1 (15 classes).

## Features / Notable capabilities
- C3k2 (faster C2f variant) backbone block.
- C2PSA partial-self-attention block in the neck.
- Across-the-board mAP improvements vs v8 at lower FLOPs.
- All five tasks supported with published weights (unlike v9/v10/v12).
- Native tracking, full export coverage.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- The "no v" naming is the single biggest pitfall for code that builds filenames.
- Same task-suffix scheme as v8.

## Sources
- https://docs.ultralytics.com/models/yolo11/
- https://docs.ultralytics.com/tasks/
