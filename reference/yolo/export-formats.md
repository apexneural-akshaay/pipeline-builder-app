# Export Formats

`model.export(format=...)` converts a `.pt` checkpoint into a deployment-ready artifact. The list below covers every format the Ultralytics package can produce, the resulting filename / directory, and the export arguments each format respects.

```python
from ultralytics import YOLO
YOLO("yolo11n.pt").export(format="onnx", imgsz=640, half=True, dynamic=True, simplify=True)
```

---

## Format matrix

| `format=`     | Output                          | half | int8 | dynamic | simplify | opset | batch | imgsz | workspace | nms | Notes |
|---------------|----------------------------------|:----:|:----:|:-------:|:--------:|:-----:|:-----:|:-----:|:---------:|:---:|-------|
| `torchscript` | `*.torchscript`                  | ✓    |      |         |          |       | ✓     | ✓     |           | ✓   | TorchScript JIT. |
| `onnx`        | `*.onnx`                         | ✓    | ✓    | ✓       | ✓        | ✓     | ✓     | ✓     |           | ✓   | Cross-framework standard. |
| `openvino`    | `*_openvino_model/` (dir)        | ✓    | ✓    | ✓       |          |       | ✓     | ✓     |           | ✓   | Intel CPU / iGPU / VPU. |
| `engine`      | `*.engine`                       | ✓    | ✓    | ✓       | ✓        |       | ✓     | ✓     | ✓         | ✓   | NVIDIA TensorRT. |
| `coreml`      | `*.mlpackage`                    | ✓    | ✓    | ✓       |          |       | ✓     | ✓     |           | ✓   | Apple Silicon / iOS. |
| `saved_model` | `*_saved_model/` (dir)           | ✓    | ✓    | ✓       |          |       | ✓     | ✓     |           | ✓   | TensorFlow SavedModel. |
| `pb`          | `*.pb`                           | ✓    |      |         |          |       | ✓     | ✓     |           |     | Frozen TF graph. |
| `tflite`      | `*.tflite`                       | ✓    | ✓    | ✓       |          |       | ✓     | ✓     |           |     | Edge / mobile. |
| `edgetpu`     | `*_edgetpu.tflite`               |      | ✓    |         |          |       | ✓     | ✓     |           |     | Google Coral. |
| `tfjs`        | `*_web_model/` (dir)             | ✓    | ✓    | ✓       |          |       | ✓     | ✓     |           |     | TensorFlow.js (browser). |
| `paddle`      | `*_paddle_model/` (dir)          |      |      |         |          |       | ✓     | ✓     |           |     | PaddlePaddle. |
| `ncnn`        | `*_ncnn_model/` (dir)            | ✓    |      | ✓       |          |       | ✓     | ✓     |           |     | Tencent NCNN (mobile CPU/ARM). |
| `mnn`         | `*.mnn`                          | ✓    | ✓    |         |          |       | ✓     | ✓     |           |     | Alibaba MNN. |
| `rknn`        | `*_rknn_model/` (dir)            |      |      |         |          |       | ✓     | ✓     |           |     | Rockchip NPUs. |
| `imx`         | `*_imx_model/` (dir)             |      | ✓    |         |          |       | ✓     | ✓     |           |     | Sony IMX500 sensor. |
| `executorch`  | `*_executorch_model/` (dir)      | ✓    |      |         |          |       | ✓     | ✓     |           |     | PyTorch ExecuTorch (mobile/edge). |

✓ = argument is honored by the exporter. Empty = argument is ignored or not applicable.

---

## Argument reference

| Argument        | Type           | Default | Meaning |
|-----------------|----------------|---------|---------|
| `format`        | str            | `"torchscript"` | One of the values above. |
| `imgsz`         | int or (h, w)  | 640     | Export input size. |
| `keras`         | bool           | False   | (TF) export `.h5` Keras model. |
| `optimize`      | bool           | False   | (TorchScript) mobile optimization. |
| `half`          | bool           | False   | FP16 weights. |
| `int8`          | bool           | False   | INT8 quantization (needs calibration data). |
| `dynamic`       | bool           | False   | Dynamic batch / shape axes (ONNX, OV, TRT, CoreML, TFLite). |
| `simplify`      | bool           | True    | (ONNX, TRT) run `onnx-simplifier`. |
| `opset`         | int            | None    | (ONNX) op-set version. |
| `workspace`     | int (GB)       | 4       | (TensorRT) workspace memory limit. |
| `nms`           | bool           | False   | Bake NMS into the exported graph (where supported). |
| `batch`         | int            | 1       | Exported batch size (use with `dynamic=False`). |
| `device`        | str / int      | None    | GPU id for export. |
| `data`          | str            | None    | (INT8) calibration dataset YAML. |
| `fraction`      | float          | 1.0     | (INT8) fraction of calibration set to use. |

---

## Practical picks for the UI

- **Cross-platform default:** `onnx` with `simplify=True`, optional `half=True` for GPU, `dynamic=True` for variable batch.
- **NVIDIA edge / server GPU:** `engine` (TensorRT) with `half=True` or `int8=True` + calibration.
- **CPU server:** `openvino` (best on Intel) or `onnx` (works everywhere).
- **Apple Silicon / iOS:** `coreml` with `half=True`.
- **Android / ARM mobile:** `ncnn` or `tflite`; for INT8 use `tflite` + `int8=True`.
- **In-browser:** `tfjs`.
- **Google Coral Edge TPU:** `edgetpu` (requires `tflite` first).
- **Rockchip / Sony IMX500:** `rknn` / `imx` for those NPUs respectively.

---

## Quirks

- TensorRT engines are **not portable** between GPU architectures / driver / TRT versions — rebuild on the target.
- CoreML `.mlpackage` is the modern format; older `.mlmodel` is also produced for some configs.
- INT8 requires representative calibration data; passing `data=...` is mandatory for `int8=True`.
- NMS-free families (YOLOv10, YOLO26, RT-DETR) have `nms=True` as a no-op.

## Sources
- https://docs.ultralytics.com/modes/export/
- https://docs.ultralytics.com/integrations/
