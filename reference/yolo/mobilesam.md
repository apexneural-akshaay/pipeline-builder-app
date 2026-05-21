# MobileSAM

## Overview
- **Release year:** June 2023.
- **Authors:** Chaoning Zhang, Dongshen Han, Yu Qiao, Jung Uk Kim, Sung-Ho Bae, Seungkyu Lee, Choong Seon Hong (Kyung Hee University). arXiv:2306.14289.
- **Description:** Drop-in lightweight replacement for SAM's image encoder. Swaps SAM's 632M-parameter ViT-H encoder for a 5M-parameter Tiny-ViT encoder while keeping the original SAM mask decoder, giving ~5× smaller model and ~7× faster inference with similar mask quality.
- **Status:** Current. Pick for on-device or mobile promptable segmentation.
- **License:** Apache-2.0.

## Tasks supported
- [x] segment (promptable, class-agnostic)
- All other tasks: N/A.

## Variants

| Variant   | Filename         | Params (M) | Size on disk | Speed CPU (ms/image) | Encoder    |
|-----------|------------------|-----------:|-------------:|---------------------:|------------|
| MobileSAM | `mobile_sam.pt`  | 10.1       | 40.7 MB      | 23,802 (reported)    | Tiny-ViT (5M) |

Comparison (per docs):

| Metric        | Original SAM (ViT-H) | MobileSAM |
|---------------|---------------------:|----------:|
| Image encoder | 632M params          | 5M params |
| Per-image speed (paper) | 456 ms     | 12 ms     |
| Model size    | 375 MB               | 40.7 MB   |

## Filename convention
- `mobile_sam.pt` — exactly one variant, underscore in the name.
- Loaded via `from ultralytics import SAM; m = SAM("mobile_sam.pt")`.

## Pretrained datasets & class lists
- Decoder weights from the original SAM (trained on SA-1B). Encoder distilled from SAM's ViT-H.

## Features / Notable capabilities
- Pin-compatible with the SAM API — point / box prompts work the same way.
- 5MB-class encoder is small enough for mobile / edge.
- Output mask quality close to SAM-B for typical prompts.

## Predict-time args worth surfacing in UI
Same as SAM: `points`, `bboxes`, `labels`, standard `imgsz` / `device` / `half`.

## Train-time args worth surfacing in UI
Not supported.

## Quirks / Gotchas
- Only one size; nothing to pick.
- For batch processing on GPU, prefer SAM 2 or FastSAM — MobileSAM's edge wins are on CPU / mobile.

## Sources
- https://docs.ultralytics.com/models/mobile-sam/
- https://arxiv.org/abs/2306.14289
