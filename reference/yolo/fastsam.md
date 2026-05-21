# FastSAM

## Overview
- **Release year:** June 2023.
- **Authors:** Xu Zhao, Wenchao Ding et al., CASIA-IVA-Lab.
- **Description:** A YOLOv8-seg-based reimplementation of SAM that runs tens-to-hundreds of times faster than the original SAM. Decouples "segment everything" into (1) all-instance segmentation with YOLOv8-seg + (2) prompt-guided mask selection.
- **Status:** Current. Pick when SAM is too slow but you still want promptable segmentation.
- **License:** Apache-2.0.

## Tasks supported
- [x] segment (promptable, class-agnostic)
- All other tasks: N/A.

## Sizes / Variants

| Variant | Filename        | Params (M) | Size on disk | Speed CPU (ms) | Dataset |
|---------|-----------------|-----------:|-------------:|---------------:|---------|
| Small   | `FastSAM-s.pt`  | 11.8       | 23.9 MB      | ~58            | SA-1B (2% subset) |
| XLarge  | `FastSAM-x.pt`  | 72         | ~140 MB      | —              | SA-1B (2% subset) |

For comparison, SAM-b is 375 MB; FastSAM-s achieves comparable mask quality at <1/15 the size.

## Filename convention
- `FastSAM-<size>.pt` with `<size>` ∈ {s, x}.
- **Note capitalization:** capital `F`, capital `S`, capital `A`, capital `M`, then hyphen.
- Loaded via `from ultralytics import FastSAM`.

## Pretrained datasets & class lists
- Trained on a 2% subset of SA-1B. Class-agnostic — outputs masks only.

## Features / Notable capabilities
- 50× faster than SAM at comparable mask quality on a CPU.
- Accepts box / point / text prompts.
- Built on the well-understood YOLOv8-seg backbone.
- Supports inference and export (no training, no validation).

## Predict-time args worth surfacing in UI
- `points`, `bboxes`, `labels` like SAM.
- `texts` for text-prompted selection.
- Standard YOLO predict args (`imgsz`, `conf`, `device`, `half`).

## Train-time args worth surfacing in UI
Not supported in `ultralytics`.

## Quirks / Gotchas
- Filename capitalization differs from every other family (`FastSAM-s.pt`, not `fastsam-s.pt`).
- Lower-precision masks than full SAM for very small or thin objects.

## Sources
- https://docs.ultralytics.com/models/fast-sam/
- https://github.com/CASIA-IVA-Lab/FastSAM
