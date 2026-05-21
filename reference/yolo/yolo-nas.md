# YOLO-NAS

## Overview
- **Release year:** May 2023.
- **Authors:** Deci AI (since acquired by NVIDIA — no further updates expected from the original team).
- **Description:** Object detector architected by Neural Architecture Search with quantization-friendly basic blocks. Designed to lose minimal accuracy under INT8 quantization.
- **Status:** Maintained by Ultralytics for inference / validation / export only. **Training is not supported.** No further development expected from the original team.
- **License:** Source code Apache-2.0; weights under Deci's pre-trained license (commercial use permitted with attribution; double-check terms).

## Tasks supported
- [x] detect
- [ ] segment
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

| Variant | Filename          | Params (M) | FLOPs (B) | mAP 50-95 | Latency (ms) | Dataset |
|---------|-------------------|-----------:|----------:|----------:|-------------:|---------|
| Small   | `yolo_nas_s.pt`   | 19.0       | 32.8      | 47.5      | 3.21         | COCO    |
| Medium  | `yolo_nas_m.pt`   | 51.1       | 88.0      | 51.55     | 5.85         | COCO    |
| Large   | `yolo_nas_l.pt`   | 66.9       | 116.0     | 52.22     | 7.87         | COCO    |

INT8-quantized variants:

| Variant      | mAP 50-95 | Latency (ms) |
|--------------|----------:|-------------:|
| YOLO-NAS-s INT8 | 47.03 | 2.36 |
| YOLO-NAS-m INT8 | 51.0  | 3.78 |
| YOLO-NAS-l INT8 | 52.1  | 4.78 |

## Filename convention
- `yolo_nas_<size>.pt` where `<size>` ∈ {s, m, l}.
- Underscores, not hyphens.
- No `-seg`, `-pose`, `-cls`, `-obb`.

## Pretrained datasets & class lists
- Trained on COCO + Objects365 + Roboflow 100 (knowledge-distillation pretraining), then fine-tuned on COCO 2017 (80 classes).

## Features / Notable capabilities
- Quantization-friendly blocks (QSP, QCI).
- Hybrid attention.
- Strong INT8 deployment story — minimal mAP drop after PTQ.
- Pretrained on Objects365 + Roboflow 100 for stronger transfer.

## Predict-time args worth surfacing in UI
Standard YOLO predict args. See [yolov8.md](./yolov8.md#predict-time-args-worth-surfacing-in-ui).

## Train-time args worth surfacing in UI
**Not supported through `ultralytics`.** Use the original `super-gradients` package if you need to train.

## Quirks / Gotchas
- Inference / validation / export only inside `ultralytics`. No `model.train()`.
- Use the `NAS` class, not `YOLO`: `from ultralytics import NAS; m = NAS("yolo_nas_s.pt")`.
- Best-in-class INT8 — pick this if int8 deployment is a hard requirement.

## Sources
- https://docs.ultralytics.com/models/yolo-nas/
- https://github.com/Deci-AI/super-gradients
