# YOLOv8

## Overview
- **Release year:** January 10, 2023.
- **Authors:** Glenn Jocher, Ayush Chaurasia, Jing Qiu (Ultralytics).
- **Description:** First fully-featured Ultralytics YOLO supporting all five computer-vision tasks out of the box. Anchor-free, decoupled head, C2f neck.
- **Status:** Current production-grade default. Superseded for new work by YOLO11/26 but still very widely used.
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

| Variant | Filename       | Params (M) | FLOPs (B) | Input | mAP 50-95 | Speed CPU ONNX (ms) | Speed A100 TRT (ms) | Dataset |
|---------|----------------|-----------:|----------:|------:|----------:|--------------------:|--------------------:|---------|
| n       | `yolov8n.pt`   | 3.2        | 8.7       | 640   | 37.3      | 80.4                | 0.99                | COCO    |
| s       | `yolov8s.pt`   | 11.2       | 28.6      | 640   | 44.9      | 128.4               | 1.20                | COCO    |
| m       | `yolov8m.pt`   | 25.9       | 78.9      | 640   | 50.2      | 234.7               | 1.83                | COCO    |
| l       | `yolov8l.pt`   | 43.7       | 165.2     | 640   | 52.9      | 375.2               | 2.39                | COCO    |
| x       | `yolov8x.pt`   | 68.2       | 257.8     | 640   | 53.9      | 479.1               | 3.53                | COCO    |

### Segmentation (COCO-seg, 640)

| Variant | Filename            | Params (M) | FLOPs (B) | mAP box | mAP mask | Dataset  |
|---------|---------------------|-----------:|----------:|--------:|---------:|----------|
| n       | `yolov8n-seg.pt`    | 3.4        | 12.6      | 36.7    | 30.5     | COCO-seg |
| s       | `yolov8s-seg.pt`    | 11.8       | 42.6      | 44.6    | 36.8     | COCO-seg |
| m       | `yolov8m-seg.pt`    | 27.3       | 110.2     | 49.9    | 40.8     | COCO-seg |
| l       | `yolov8l-seg.pt`    | 46.0       | 220.5     | 52.3    | 42.6     | COCO-seg |
| x       | `yolov8x-seg.pt`    | 71.8       | 344.1     | 53.4    | 43.4     | COCO-seg |

### Pose (COCO-pose, 640, single class "person", 17 keypoints)

| Variant | Filename               | Params (M) | FLOPs (B) | mAP pose (50-95) | mAP pose 50 | Dataset   |
|---------|------------------------|-----------:|----------:|-----------------:|------------:|-----------|
| n       | `yolov8n-pose.pt`      | 3.3        | 9.2       | 50.4             | 80.1        | COCO-pose |
| s       | `yolov8s-pose.pt`      | 11.6       | 30.2      | 60.0             | 86.2        | COCO-pose |
| m       | `yolov8m-pose.pt`      | 26.4       | 81.0      | 65.0             | 88.8        | COCO-pose |
| l       | `yolov8l-pose.pt`      | 44.4       | 168.6     | 67.6             | 90.0        | COCO-pose |
| x       | `yolov8x-pose.pt`      | 69.4       | 263.2     | 69.2             | 90.2        | COCO-pose |
| x-p6    | `yolov8x-pose-p6.pt`   | 99.1       | 1066.4    | 71.6             | 91.2        | COCO-pose (1280) |

### Classification (ImageNet-1k, 224)

| Variant | Filename            | Params (M) | FLOPs (B) @224 | Top-1 acc | Top-5 acc | Dataset     |
|---------|---------------------|-----------:|---------------:|----------:|----------:|-------------|
| n       | `yolov8n-cls.pt`    | 2.7        | 4.3            | 69.0      | 88.3      | ImageNet-1k |
| s       | `yolov8s-cls.pt`    | 6.4        | 13.5           | 73.8      | 91.7      | ImageNet-1k |
| m       | `yolov8m-cls.pt`    | 17.0       | 42.7           | 76.8      | 93.5      | ImageNet-1k |
| l       | `yolov8l-cls.pt`    | 37.5       | 99.7           | 78.3      | 94.2      | ImageNet-1k |
| x       | `yolov8x-cls.pt`    | 57.4       | 154.8          | 79.0      | 94.6      | ImageNet-1k |

### OBB (DOTAv1, 1024)

| Variant | Filename            | Params (M) | FLOPs (B) | mAP 50 | Dataset |
|---------|---------------------|-----------:|----------:|-------:|---------|
| n       | `yolov8n-obb.pt`    | 3.1        | 23.3      | 78.0   | DOTAv1  |
| s       | `yolov8s-obb.pt`    | 11.4       | 76.3      | 79.5   | DOTAv1  |
| m       | `yolov8m-obb.pt`    | 26.4       | 208.6     | 80.5   | DOTAv1  |
| l       | `yolov8l-obb.pt`    | 44.5       | 433.8     | 80.7   | DOTAv1  |
| x       | `yolov8x-obb.pt`    | 69.5       | 676.7     | 81.4   | DOTAv1  |

## Filename convention
- Detect: `yolov8<size>.pt`
- Segment: `yolov8<size>-seg.pt`
- Pose: `yolov8<size>-pose.pt` (plus `yolov8x-pose-p6.pt` at 1280)
- Classify: `yolov8<size>-cls.pt`
- OBB: `yolov8<size>-obb.pt`
- Sizes: n, s, m, l, x

## Pretrained datasets & class lists
- Detect / Segment → COCO 2017 (80 classes) — see [datasets.md](./datasets.md#coco-80-class-list).
- Pose → COCO-pose (1 class "person", 17 keypoints) — see [datasets.md](./datasets.md#coco-pose-keypoints).
- Classify → ImageNet-1k (1000 classes).
- OBB → DOTAv1 (15 classes) — see [datasets.md](./datasets.md#dotav1-15-class-list).

## Features / Notable capabilities
- Anchor-free, decoupled detection head.
- C2f bottleneck (better gradient flow than C3 in v5).
- All five tasks share the same backbone/neck families.
- Native tracking (ByteTrack / BoT-SORT).
- Full export coverage (ONNX, TensorRT, CoreML, OpenVINO, TFLite, TFJS, PaddlePaddle, NCNN, etc.).
- AMP training, multi-GPU, distillation.

## Predict-time args worth surfacing in UI

| Arg            | Type           | Default | Meaning |
|----------------|----------------|---------|---------|
| `conf`         | float          | 0.25    | Min detection confidence |
| `iou`          | float          | 0.7     | NMS IoU threshold |
| `imgsz`        | int / (h, w)   | 640     | Inference image size |
| `half`         | bool           | False   | FP16 inference on GPU |
| `device`       | str / int / list | None  | `cpu`, `0`, `0,1`, `mps` |
| `max_det`      | int            | 300     | Max detections per image |
| `vid_stride`   | int            | 1       | Skip N frames in video |
| `stream_buffer`| bool           | False   | Buffer frames vs. drop |
| `visualize`    | bool           | False   | Save feature visualizations |
| `augment`      | bool           | False   | Test-time augmentation |
| `agnostic_nms` | bool           | False   | Class-agnostic NMS |
| `classes`      | list[int]      | None    | Filter to these class IDs |
| `retina_masks` | bool           | False   | Hi-res segmentation masks |
| `embed`        | list[int]      | None    | Return feature embeddings from layers |
| `show`         | bool           | False   | Live display window |
| `save`         | bool           | False   | Save annotated outputs |
| `save_txt`     | bool           | False   | Save labels as .txt |
| `save_conf`    | bool           | False   | Include conf in saved labels |
| `save_crop`    | bool           | False   | Save cropped detections |
| `show_labels`  | bool           | True    | Draw class labels |
| `show_conf`    | bool           | True    | Draw confidence |
| `show_boxes`   | bool           | True    | Draw bounding boxes |
| `line_width`   | int / None     | None    | Box line thickness |
| `project`      | str            | None    | Output project dir |
| `name`         | str            | None    | Output run name |

## Train-time args worth surfacing in UI

| Arg               | Type             | Default | Meaning |
|-------------------|------------------|---------|---------|
| `model`           | str              | —       | `.pt` checkpoint or `.yaml` config |
| `data`            | str              | —       | Path to dataset YAML |
| `epochs`          | int              | 100     | Training epochs |
| `time`            | float / None     | None    | Max training time (hours) |
| `patience`        | int              | 100     | Early-stop patience epochs |
| `batch`           | int / float      | 16      | Batch size (`-1` = auto) |
| `imgsz`           | int              | 640     | Training image size |
| `save`            | bool             | True    | Save checkpoints |
| `save_period`     | int              | -1      | Save every N epochs |
| `cache`           | bool / str       | False   | `ram` / `disk` cache |
| `device`          | int / str / list | None    | GPU(s) |
| `workers`         | int              | 8       | Dataloader workers |
| `optimizer`       | str              | auto    | SGD, Adam, AdamW, NAdam, RAdam, RMSProp |
| `seed`            | int              | 0       | RNG seed |
| `deterministic`   | bool             | True    | Force deterministic ops |
| `single_cls`      | bool             | False   | Treat all classes as one |
| `rect`            | bool             | False   | Rectangular training |
| `cos_lr`          | bool             | False   | Cosine LR schedule |
| `close_mosaic`    | int              | 10      | Disable mosaic for last N epochs |
| `resume`          | bool             | False   | Resume last run |
| `amp`             | bool             | True    | Automatic mixed precision |
| `fraction`        | float            | 1.0     | Use this fraction of the dataset |
| `freeze`          | int / list       | None    | Freeze first N layers |
| `lr0`             | float            | 0.01    | Initial LR |
| `lrf`             | float            | 0.01    | Final LR factor |
| `momentum`        | float            | 0.937   | SGD momentum / Adam beta1 |
| `weight_decay`    | float            | 0.0005  | L2 reg |
| `warmup_epochs`   | float            | 3.0     | Warmup epochs |
| `warmup_momentum` | float            | 0.8     | Warmup starting momentum |
| `warmup_bias_lr`  | float            | 0.1     | Warmup bias LR |
| `box`             | float            | 7.5     | Box loss weight |
| `cls`             | float            | 0.5     | Class loss weight |
| `dfl`             | float            | 1.5     | DFL loss weight |
| `pose`            | float            | 12.0    | Pose loss weight (pose only) |
| `kobj`            | float            | 1.0     | Keypoint objectness loss weight |
| `label_smoothing` | float            | 0.0     | Label smoothing eps |
| `nbs`             | int              | 64      | Nominal batch size |
| `overlap_mask`    | bool             | True    | Allow overlapping masks (seg) |
| `mask_ratio`      | int              | 4       | Mask downsample ratio (seg) |
| `dropout`         | float            | 0.0     | Dropout (cls) |
| `val`             | bool             | True    | Validate during training |
| `plots`           | bool             | False   | Save training plots |
| `hsv_h`           | float            | 0.015   | Hue jitter |
| `hsv_s`           | float            | 0.7     | Saturation jitter |
| `hsv_v`           | float            | 0.4     | Value jitter |
| `degrees`         | float            | 0.0     | Rotation aug ± deg |
| `translate`       | float            | 0.1     | Translation aug |
| `scale`           | float            | 0.5     | Scale aug |
| `shear`           | float            | 0.0     | Shear aug |
| `perspective`     | float            | 0.0     | Perspective aug |
| `flipud`          | float            | 0.0     | Vertical flip prob |
| `fliplr`          | float            | 0.5     | Horizontal flip prob |
| `bgr`             | float            | 0.0     | BGR channel flip prob |
| `mosaic`          | float            | 1.0     | Mosaic aug prob |
| `mixup`           | float            | 0.0     | MixUp prob |
| `copy_paste`      | float            | 0.0     | Copy-paste aug (seg) |
| `auto_augment`    | str              | randaugment | Auto-aug policy (cls) |
| `erasing`         | float            | 0.4     | Random erasing (cls) |
| `crop_fraction`   | float            | 1.0     | Center-crop fraction (cls) |

## Quirks / Gotchas
- `yolov8x-pose-p6.pt` uses 1280 input and is much heavier than the rest of the pose line.
- OBB models default to 1024 input (not 640) because DOTA tiles are 1024×1024.
- Classification weights use 224 input, not 640.

## Sources
- https://docs.ultralytics.com/models/yolov8/
- https://docs.ultralytics.com/tasks/detect/
- https://docs.ultralytics.com/tasks/segment/
- https://docs.ultralytics.com/tasks/classify/
- https://docs.ultralytics.com/tasks/pose/
- https://docs.ultralytics.com/tasks/obb/
- https://docs.ultralytics.com/modes/predict/
- https://docs.ultralytics.com/modes/train/
