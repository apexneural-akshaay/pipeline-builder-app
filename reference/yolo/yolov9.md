# YOLOv9

## Overview
- **Release year:** February 2024.
- **Authors:** Chien-Yao Wang and Hong-Yuan Mark Liao.
- **Description:** Introduces Programmable Gradient Information (PGI) and the Generalized Efficient Layer Aggregation Network (GELAN). Built on the YOLOv5 codebase, ported into `ultralytics`.
- **Status:** Current alongside v10/v11 — pick when peak COCO accuracy matters at the high end.
- **License:** AGPL-3.0 and Enterprise (Ultralytics build).

## Tasks supported
- [x] detect
- [x] segment (only the `c` and `e` sizes)
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

### Detection

| Variant  | Filename       | Params (M) | FLOPs (B) | Input | mAP 50-95 | Dataset |
|----------|----------------|-----------:|----------:|------:|----------:|---------|
| Tiny     | `yolov9t.pt`   | 2.0        | 7.7       | 640   | 38.3      | COCO    |
| Small    | `yolov9s.pt`   | 7.2        | 26.7      | 640   | 46.8      | COCO    |
| Medium   | `yolov9m.pt`   | 20.1       | 76.8      | 640   | 51.4      | COCO    |
| Compact  | `yolov9c.pt`   | 25.5       | 102.8     | 640   | 53.0      | COCO    |
| Extended | `yolov9e.pt`   | 58.1       | 192.5     | 640   | 55.6      | COCO    |

### Segmentation

| Variant  | Filename            | Params (M) | FLOPs (B) | mAP box | mAP mask | Dataset  |
|----------|---------------------|-----------:|----------:|--------:|---------:|----------|
| Compact  | `yolov9c-seg.pt`    | 27.9       | 159.4     | 52.3    | 42.4     | COCO-seg |
| Extended | `yolov9e-seg.pt`    | 60.5       | 248.4     | 55.1    | 44.3     | COCO-seg |

## Filename convention
- Detect: `yolov9<size>.pt`, `<size>` ∈ {t, s, m, c, e}.
- Segment: `yolov9<size>-seg.pt` — only `c` and `e` are released.
- **Note:** v9 uses t/s/m/c/e (not n/s/m/l/x). The assembler must special-case this family.

## Pretrained datasets & class lists
- COCO 2017 (80 classes) for detect.
- COCO-seg (80 classes) for segment.

## Features / Notable capabilities
- Programmable Gradient Information (PGI) — auxiliary supervision branch.
- GELAN backbone.
- Top end (`yolov9e`) is the most accurate sub-100M-param YOLO at release.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- Size-letter scheme is t/s/m/c/e — not n/s/m/l/x.
- Segmentation only exists for `c` and `e`. No `t-seg`, `s-seg`, `m-seg`.
- Heavier `*e` variant trains slowly; expect days on a single GPU.

## Sources
- https://docs.ultralytics.com/models/yolov9/
- https://github.com/WongKinYiu/yolov9
