# Ultralytics Model Reference — Master Index

This folder is a structured technical reference for every model family the Ultralytics Python package can load via `ultralytics.YOLO(...)`, `ultralytics.SAM(...)`, `ultralytics.FastSAM(...)`, `ultralytics.NAS(...)`, `ultralytics.RTDETR(...)`, `ultralytics.YOLOWorld(...)`, `ultralytics.YOLOE(...)`.

Numbers in family files come from the official docs at https://docs.ultralytics.com/ . Where the docs don't publish a number, the cell is `—` rather than invented.

---

## 1. Task support matrix

| Family    | Detect | Segment | Classify | Pose | OBB | Track | Open-Vocab |
|-----------|:------:|:-------:|:--------:|:----:|:---:|:-----:|:----------:|
| YOLOv3    | ✓      | —       | —        | —    | —   | ✓     | —          |
| YOLOv5    | ✓      | ✓ (orig repo) | ✓ (orig repo) | — | — | ✓ | — |
| YOLOv6    | ✓      | —       | —        | —    | —   | ✓     | —          |
| YOLOv7    | ✓ (inference only) | — | — | — | — | — | — |
| YOLOv8    | ✓      | ✓       | ✓        | ✓    | ✓   | ✓     | —          |
| YOLOv9    | ✓      | ✓ (c/e) | —        | —    | —   | ✓     | —          |
| YOLOv10   | ✓      | —       | —        | —    | —   | ✓     | —          |
| YOLO11    | ✓      | ✓       | ✓        | ✓    | ✓   | ✓     | —          |
| YOLO12    | ✓      | ✓ (arch only) | ✓ (arch only) | ✓ (arch only) | ✓ (arch only) | ✓ | — |
| YOLO26    | ✓      | ✓       | ✓        | ✓    | ✓   | ✓     | ✓ (via YOLOE-26) |
| YOLO-NAS  | ✓      | —       | —        | —    | —   | ✓     | —          |
| YOLO-World| ✓      | —       | —        | —    | —   | ✓     | ✓          |
| YOLOE     | ✓      | ✓       | —        | —    | —   | ✓     | ✓          |
| RT-DETR   | ✓      | —       | —        | —    | —   | ✓     | —          |
| SAM / SAM2| —      | ✓ (promptable) | — | —   | —   | — (SAM2 has video) | — |
| FastSAM   | —      | ✓       | —        | —    | —   | —     | —          |
| MobileSAM | —      | ✓       | —        | —    | —   | —     | —          |

`✓ (arch only)` = YAML architecture is in the package but Ultralytics does not publish pretrained `.pt` weights for that task.

---

## 2. Filename / size-letter matrix

Single most useful artifact for code that mechanically assembles filenames from `(family, task, size)`.

### Detection (default)

| Family    | n / t        | s         | m         | l / c     | x / e / b   | Notes |
|-----------|--------------|-----------|-----------|-----------|-------------|-------|
| YOLOv3    | yolov3-tinyu.pt | —      | —         | yolov3u.pt  | yolov3-sppu.pt | tiny + base + spp; `u` suffix = anchor-free |
| YOLOv5    | yolov5nu.pt  | yolov5su.pt | yolov5mu.pt | yolov5lu.pt | yolov5xu.pt | also 1280-input `n6/s6/m6/l6/x6u` |
| YOLOv6    | yolov6n.yaml | yolov6s.yaml | yolov6m.yaml | yolov6l.yaml | yolov6x.yaml | architecture YAMLs; no Ultralytics-released `.pt` |
| YOLOv7    | —            | —         | —         | yolov7.pt (export-only) | yolov7x.pt | inference via ONNX/TRT only |
| YOLOv8    | yolov8n.pt   | yolov8s.pt | yolov8m.pt | yolov8l.pt | yolov8x.pt | |
| YOLOv9    | yolov9t.pt   | yolov9s.pt | yolov9m.pt | yolov9c.pt | yolov9e.pt | uses t/s/m/c/e — not n/s/m/l/x |
| YOLOv10   | yolov10n.pt  | yolov10s.pt | yolov10m.pt | yolov10l.pt | yolov10x.pt | also `yolov10b.pt` (Balanced) |
| YOLO11    | yolo11n.pt   | yolo11s.pt | yolo11m.pt | yolo11l.pt | yolo11x.pt | no "v" in filename |
| YOLO12    | yolo12n.pt   | yolo12s.pt | yolo12m.pt | yolo12l.pt | yolo12x.pt | no "v" |
| YOLO26    | yolo26n.pt   | yolo26s.pt | yolo26m.pt | yolo26l.pt | yolo26x.pt | no "v" |
| YOLO-NAS  | yolo_nas_s.pt | yolo_nas_s.pt | yolo_nas_m.pt | yolo_nas_l.pt | — | underscores; s/m/l only |
| YOLO-World| yolov8s-world.pt / -worldv2.pt | … | yolov8m-world(v2).pt | yolov8l-world(v2).pt | yolov8x-world(v2).pt | open-vocab; built on v8 |
| YOLOE     | yoloe-11n.pt etc. (and yoloe-26<size>.pt) | … | … | … | … | see yoloe.md |
| RT-DETR   | —            | —         | —         | rtdetr-l.pt | rtdetr-x.pt | transformer-based |

### Task suffix convention (for YOLO families that support multiple tasks)

| Task        | Suffix      | Example (v8)        | Example (11)        |
|-------------|-------------|---------------------|---------------------|
| Detect      | (none)      | `yolov8s.pt`        | `yolo11s.pt`        |
| Segment     | `-seg`      | `yolov8s-seg.pt`    | `yolo11s-seg.pt`    |
| Pose        | `-pose`     | `yolov8s-pose.pt`   | `yolo11s-pose.pt`   |
| Classify    | `-cls`      | `yolov8s-cls.pt`    | `yolo11s-cls.pt`    |
| OBB         | `-obb`      | `yolov8s-obb.pt`    | `yolo11s-obb.pt`    |
| World       | `-world` / `-worldv2` | `yolov8s-worldv2.pt` | — |

Rule for the assembler: `${family_prefix}${size}${task_suffix}.pt`.
Irregularities: v3 (tiny/u/spp instead of n/s/m/l/x), v5 (`*u` suffix), v9 (t/s/m/c/e), v10 (extra `b`), NAS (`yolo_nas_<size>.pt`), RT-DETR (only l/x), World (built on v8 backbone), SAM/FastSAM/MobileSAM (`sam_b.pt`, `sam_l.pt`, `sam2_t.pt`/`sam2_s.pt`/`sam2_b.pt`/`sam2_l.pt`, `FastSAM-s.pt`, `FastSAM-x.pt`, `mobile_sam.pt`).

---

## 3. When-to-use guide (one paragraph per family)

- **YOLOv3** — Legacy. Use only when reproducing 2018-era baselines; otherwise pick v8 or v11.
- **YOLOv5** — Mature, widely deployed, huge community. The Ultralytics `*u` variants are anchor-free re-trains. Pick if you need ecosystem maturity and broad export support.
- **YOLOv6** — Meituan's industrial detector; integrated as architecture YAMLs. Pick when reproducing v6 paper results.
- **YOLOv7** — Inference-only in Ultralytics. Pick only if you already have v7 checkpoints to deploy via ONNX/TensorRT.
- **YOLOv8** — Default safe pick across all five tasks (detect/seg/pose/cls/obb). Excellent docs, tracking, exports, third-party tooling.
- **YOLOv9** — When accuracy at the high end matters and you can afford `yolov9e` (55.6 mAP). Programmable Gradient Information (PGI).
- **YOLOv10** — NMS-free; lowest latency at given accuracy. Pick for real-time edge detection where post-processing matters.
- **YOLO11** — Current default for new projects. Better than v8 at all sizes and supports all five tasks with published weights.
- **YOLO12** — Attention-centric (transformer-style attention inside the backbone). Pick for detection accuracy on COCO; other tasks have architecture but no pretrained weights yet.
- **YOLO26** — Latest (Jan 2026). NMS-free, edge-optimized, MuSGD optimizer, dual-head. Pick for new edge deployments.
- **YOLO-NAS** — Quantization-friendly, INT8-strong. Pick when you need rock-solid INT8 deployment and accept that training is not supported.
- **YOLO-World** — Open-vocabulary: call `model.set_classes([...])` with arbitrary text. Pick when classes are unknown at training time.
- **YOLOE** — Better than World on LVIS; also does open-vocabulary segmentation. Pick when you need promptable detect+seg.
- **RT-DETR** — Transformer detector, NMS-free, very strong accuracy. Pick when CNN inductive bias hurts your domain.
- **SAM / SAM 2** — Promptable "segment anything." Pick when classes are unknown but a user can click/box. SAM 2 adds video.
- **FastSAM** — 50x cheaper SAM via YOLOv8-seg base. Pick when SAM is too slow.
- **MobileSAM** — 5MB encoder. Pick for on-device/mobile promptable segmentation.

---

## 4. Glossary

- **mAP / mAP50-95** — mean Average Precision across IoU thresholds 0.50 to 0.95 (step 0.05), averaged over classes. The COCO default metric.
- **mAP50** — mAP at IoU 0.50 only (easier).
- **FLOPs** — Floating-point operations to run one forward pass at the listed input size. Reported in B (billion / GFLOPs).
- **Params** — Trainable parameter count in millions.
- **NMS** — Non-Maximum Suppression. Post-processing that removes duplicate boxes. "NMS-free" models (v10, v26, RT-DETR) skip this step.
- **Anchor-free** — Predicts boxes relative to pixels/grid cells without predefined anchor priors. All Ultralytics-trained YOLOs since v6 are anchor-free.
- **DFL** — Distribution Focal Loss. Predicts box edges as discrete distributions; standard in v8/v11.
- **PGI** — Programmable Gradient Information (YOLOv9's headline mechanism).
- **Open-vocabulary** — Classes defined at inference time via text or image prompts (World, YOLOE, SAM3).
- **OBB** — Oriented Bounding Box. Rotated rectangles for aerial/document objects.
- **Keypoints** — Named landmark points; COCO-pose uses 17.

---

## 5. Files in this folder

- [yolov3.md](./yolov3.md)
- [yolov5.md](./yolov5.md)
- [yolov6.md](./yolov6.md)
- [yolov7.md](./yolov7.md)
- [yolov8.md](./yolov8.md)
- [yolov9.md](./yolov9.md)
- [yolov10.md](./yolov10.md)
- [yolo11.md](./yolo11.md)
- [yolo12.md](./yolo12.md)
- [yolo26.md](./yolo26.md)
- [yolo-nas.md](./yolo-nas.md)
- [yolo-world.md](./yolo-world.md)
- [yoloe.md](./yoloe.md)
- [rt-detr.md](./rt-detr.md)
- [sam.md](./sam.md)
- [fastsam.md](./fastsam.md)
- [mobilesam.md](./mobilesam.md)
- [datasets.md](./datasets.md)
- [tasks.md](./tasks.md)
- [tracking.md](./tracking.md)
- [export-formats.md](./export-formats.md)

## Sources
- https://docs.ultralytics.com/models/
- https://docs.ultralytics.com/tasks/
- https://github.com/ultralytics/ultralytics
