# YOLOv7

## Overview
- **Release year:** July 2022 (Wang, Bochkovskiy, Liao — authors of YOLOv4).
- **Description:** Real-time detector built on a "trainable bag-of-freebies" — model re-parameterization, dynamic label assignment, extended/compound scaling.
- **Status:** Inference-only in the `ultralytics` package. Native PyTorch training is not supported; you must export checkpoints from the upstream WongKinYiu/yolov7 repo.
- **License:** GPL-3.0 (WongKinYiu's original release).

## Tasks supported
- [x] detect (ONNX / TensorRT inference only)
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [ ] track

## Sizes / Variants

| Variant | Filename        | Params (M) | FLOPs (B) | Input size | mAP (val)     | Speed | Dataset |
|---------|-----------------|-----------:|----------:|-----------:|--------------:|------:|---------|
| Base    | `yolov7.pt`     | 36.9       | 104.7     | 640        | 51.4 (AP, V100) | 161 fps | COCO  |
| X       | `yolov7x.pt`    | 71.3       | 189.9     | 640        | 53.1 (AP, V100) | 114 fps | COCO  |
| W6      | `yolov7-w6.pt`  | 70.4       | 360.0     | 1280       | 54.9          | —     | COCO    |
| E6      | `yolov7-e6.pt`  | 97.2       | 515.2     | 1280       | 56.0          | —     | COCO    |
| D6      | `yolov7-d6.pt`  | 154.7      | 806.8     | 1280       | 56.6          | —     | COCO    |
| E6E     | `yolov7-e6e.pt` | 151.7      | 843.2     | 1280       | 56.8          | —     | COCO    |

Numbers come from the v7 paper. Peak claimed AP at launch: 56.8 on COCO.

## Filename convention
- `yolov7.pt`, `yolov7x.pt` (640 input).
- `yolov7-w6.pt`, `yolov7-e6.pt`, `yolov7-d6.pt`, `yolov7-e6e.pt` (1280 input).
- Pose / instance-seg checkpoints exist in the upstream repo (`yolov7-w6-pose.pt`, `yolov7-seg.pt`) but are not exposed through `ultralytics`.

## Pretrained datasets & class lists
- COCO 2017 (80 classes).

## Features / Notable capabilities
- 40% fewer parameters / 50% less compute vs. YOLOv5 at comparable accuracy (paper claim).
- Extended efficient layer aggregation networks (E-ELAN).
- Auxiliary head training scheme (deep supervision).

## Predict-time args worth surfacing in UI
For ONNX/TensorRT inference inside `ultralytics`, only the export-relevant args apply (`conf`, `iou`, `imgsz`, `device`, `half`).

## Train-time args worth surfacing in UI
N/A in Ultralytics — train upstream.

## Quirks / Gotchas
- No native PyTorch training inside `ultralytics`.
- Checkpoint format is not compatible with `ultralytics.YOLO("...")`; you must export to ONNX/TensorRT first.
- Superseded for accuracy by YOLO11/26.

## Sources
- https://docs.ultralytics.com/models/yolov7/
- https://github.com/WongKinYiu/yolov7
