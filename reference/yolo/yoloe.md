# YOLOE

## Overview
- **Release year:** 2025.
- **Authors:** Tsinghua University (Ao Wang, Lihao Liu, Hui Chen, Zijia Lin, Jungong Han, Guiguang Ding).
- **Description:** "Real-time seeing anything." Open-vocabulary detection **and segmentation** in a single promptable model. Supports text prompts, image (visual) prompts, and a built-in 1200+ category internal vocabulary for prompt-free mode.
- **Status:** Current — improves on YOLO-World v2 by +3.5 AP on LVIS with one-third the training resources.
- **License:** AGPL-3.0.

## Tasks supported
- [x] detect (open-vocabulary)
- [x] segment (open-vocabulary)
- [ ] classify
- [ ] pose
- [ ] obb
- [x] track

## Sizes / Variants

Available across multiple scales. Two backbone generations are released:

- **YOLOE-11** family — built on the YOLO11 backbone.
- **YOLOE-26** family — built on the YOLO26 backbone, latest.

For each generation, sizes n / s / m / l / x exist. Indicative filename pattern (verify against your `ultralytics` version):

| Variant         | Filename                |
|-----------------|-------------------------|
| YOLOE-11n       | `yoloe-11n.pt`          |
| YOLOE-11s       | `yoloe-11s.pt`          |
| YOLOE-11m       | `yoloe-11m.pt`          |
| YOLOE-11l       | `yoloe-11l.pt`          |
| YOLOE-26n       | `yoloe-26n.pt`          |
| YOLOE-26s       | `yoloe-26s.pt`          |
| YOLOE-26m       | `yoloe-26m.pt`          |
| YOLOE-26l       | `yoloe-26l.pt`          |
| YOLOE-26x       | `yoloe-26x.pt`          |

Published benchmark snapshot: **YOLOE26-L** reaches 36.8% LVIS mAP with 32.3M params at 161 FPS on T4.
Per-size params / FLOPs / mAP were not fully tabulated in the docs page at fetch time.

## Filename convention
- `yoloe-<backbone-version><size>.pt`, e.g. `yoloe-11s.pt`, `yoloe-26l.pt`.
- The `-seg` suffix exists for segmentation-specific variants.

## Pretrained datasets & class lists
- Trained on Objects365 + GQA + Flickr30k (similar to YOLO-World) and evaluated on LVIS.
- Internal vocabulary covers 1200+ categories.

## Features / Notable capabilities
- **Text-prompted detection** (RepRTA module) — call `model.set_classes([...])`.
- **Visual-prompted detection** (SAVPE module) — give it reference crops.
- **Prompt-free mode** (LRPC module) — uses the internal 1200+ category vocabulary out of the box.
- **Open-vocabulary segmentation**, not just detection.
- One-third the training resources of YOLO-Worldv2.

## Predict-time args worth surfacing in UI
Standard predict args plus the open-vocab prompting controls:
- `model.set_classes(["text prompt 1", ...])` for text mode.
- Visual prompts via reference images (advanced — see docs).
- Prompt-free runs with the internal vocab.

## Train-time args worth surfacing in UI
Standard. See [yolov8.md](./yolov8.md#train-time-args-worth-surfacing-in-ui).

## Quirks / Gotchas
- Two backbone generations co-exist (`-11*` and `-26*`); pick to match your latency/accuracy point.
- For open-vocab detection-only with mature tooling, YOLO-World is still a fine pick.
- LVIS labels (long-tail) differ from COCO labels — prompts must match the LVIS vocabulary if you care about benchmarked accuracy.

## Sources
- https://docs.ultralytics.com/models/yoloe/
- https://github.com/THU-MIG/yoloe
