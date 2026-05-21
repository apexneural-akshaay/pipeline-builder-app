# YOLOv10

## Overview
- **Release year:** May 2024.
- **Authors:** Tsinghua University (Ao Wang et al.). Integrated into Ultralytics.
- **Description:** First mainstream **NMS-free** YOLO. Uses "consistent dual assignments" — a one-to-many head during training plus a one-to-one head for inference, eliminating the need for NMS post-processing.
- **Status:** Current. Pick for low-latency real-time detection.
- **License:** AGPL-3.0.

## Tasks supported
- [x] detect
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

| Variant     | Filename        | Params (M) | FLOPs (B) | Input | mAP 50-95 | Latency (ms) | Dataset |
|-------------|-----------------|-----------:|----------:|------:|----------:|-------------:|---------|
| Nano        | `yolov10n.pt`   | 2.3        | 6.7       | 640   | 39.5      | 1.84         | COCO    |
| Small       | `yolov10s.pt`   | 7.2        | 21.6      | 640   | 46.8      | 2.49         | COCO    |
| Medium      | `yolov10m.pt`   | 15.4       | 59.1      | 640   | 51.3      | 4.74         | COCO    |
| Balanced    | `yolov10b.pt`   | 19.1       | 92.0      | 640   | 52.5      | 5.74         | COCO    |
| Large       | `yolov10l.pt`   | 24.4       | 120.3     | 640   | 53.4      | 7.28         | COCO    |
| XLarge      | `yolov10x.pt`   | 29.5       | 160.4     | 640   | 54.4      | 10.70        | COCO    |

`b` (Balanced) is unique to v10 — fits between m and l.

## Filename convention
- Detect: `yolov10<size>.pt`, `<size>` ∈ {n, s, m, b, l, x}.
- No `-seg`, `-pose`, `-cls`, `-obb` variants.

## Pretrained datasets & class lists
- COCO 2017 (80 classes).

## Features / Notable capabilities
- NMS-free end-to-end inference (no `iou` arg needed at predict time).
- Consistent dual assignments (training trick).
- Holistic efficiency-accuracy driven model design — partial self-attention, rank-guided block design.
- YOLOv10-S is ~1.8× faster than RT-DETR-R18 at comparable accuracy.

## Predict-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).
**Note:** `iou`/`agnostic_nms` have no effect because there is no NMS step.

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- Six size letters (extra `b`) — assembler must include `b`.
- Detection-only family; if you need seg/pose/cls/obb pick v8 or v11.
- Because there's no NMS, post-processing tweaks done in v8/v11 pipelines don't transfer.

## Sources
- https://docs.ultralytics.com/models/yolov10/
- https://github.com/THU-MIG/yolov10
