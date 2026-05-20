# [imports]
import torch as _torch_y
from ultralytics import YOLO

# [setup]
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into {{weights}}.
model_{{node_id}} = YOLO("{{weights}}")
TASK_{{node_id}} = "{{task}}"
TRACKING_{{node_id}} = {{tracking}}              # True to use model.track(), False for model()
CLASSES_{{node_id}} = {{classes}}                # list of class names to keep; empty list = all
CONF_{{node_id}} = float("{{confidence}}")

# COCO 17 keypoint names for pose task — used to label keypoints in event metadata.
POSE_KP_NAMES = [
    "nose","left_eye","right_eye","left_ear","right_ear",
    "left_shoulder","right_shoulder","left_elbow","right_elbow",
    "left_wrist","right_wrist","left_hip","right_hip",
    "left_knee","right_knee","left_ankle","right_ankle",
]

# Log model summary at startup (mirrors the notebook's `model.info()` call).
try:
    _info_{{node_id}} = model_{{node_id}}.info()
    if isinstance(_info_{{node_id}}, tuple) and len(_info_{{node_id}}) >= 4:
        _layers, _params, _grads, _gflops = _info_{{node_id}}
        print(f"yolo_model {{node_id}}: loaded {{weights}} | layers={_layers} params={int(_params):,} gflops={_gflops:.2f}")
    else:
        print(f"yolo_model {{node_id}}: loaded {{weights}}")
except Exception as _e_{{node_id}}:
    print(f"yolo_model {{node_id}}: loaded {{weights}} (info unavailable: {_e_{{node_id}}})")

# Auto-pick a CPU-friendly inference size (multiple of 32, between 320 and 640).
# Larger values are more accurate but slower; raise the cap if you have a GPU.
def _pick_imgsz_{{node_id}}(w, h):
    long_side = max(w, h)
    snapped = max(320, min(640, int(round(long_side / 32.0)) * 32))
    return snapped

# Tracking is only valid on detect / segment / pose models (per Ultralytics docs).
# If user asked for tracking on an incompatible task, fall back to plain inference.
if TRACKING_{{node_id}} and TASK_{{node_id}} not in ("detect", "segment", "pose"):
    print(f"yolo_model {{node_id}}: tracking not supported for task '{TASK_{{node_id}}}', falling back to inference.")
    TRACKING_{{node_id}} = False

import time as _time_{{node_id}}
_inferred_{{node_id}} = 0
_last_hb_y_{{node_id}} = _time_{{node_id}}.time()

# Resolve class NAMES (e.g. ["person","car"]) to YOLO class INDICES so we can pass
# classes=[...] to inference. This is the correct way to filter: only the requested
# classes will be returned, AND results[0].plot() will only draw those boxes.
_name_to_id_{{node_id}} = {v: int(k) for k, v in model_{{node_id}}.names.items()}
CLASS_IDS_{{node_id}} = [_name_to_id_{{node_id}}[n] for n in CLASSES_{{node_id}} if n in _name_to_id_{{node_id}}]
if CLASSES_{{node_id}} and not CLASS_IDS_{{node_id}}:
    print(f"yolo_model {{node_id}}: WARNING none of {CLASSES_{{node_id}}} matched model classes; ignoring filter.")
_filter_desc_{{node_id}} = CLASS_IDS_{{node_id}} if CLASS_IDS_{{node_id}} else "ALL"
print(f"yolo_model {{node_id}}: filtering to class ids {_filter_desc_{{node_id}}}")

# [loop]
src = state["{{input_id}}"]
frame_in = src["frame"]
imgsz_{{node_id}} = _pick_imgsz_{{node_id}}(src["width"], src["height"])

# Build kwargs once so we can pass classes= only when there's a filter
_kwargs_{{node_id}} = dict(conf=CONF_{{node_id}}, imgsz=imgsz_{{node_id}}, verbose=False)
if CLASS_IDS_{{node_id}}:
    _kwargs_{{node_id}}["classes"] = CLASS_IDS_{{node_id}}

with _torch_y.inference_mode():
    if TRACKING_{{node_id}}:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_{{node_id}} = model_{{node_id}}.track(frame_in, persist=True, **_kwargs_{{node_id}})
    else:
        results_{{node_id}} = model_{{node_id}}(frame_in, **_kwargs_{{node_id}})

dets_{{node_id}} = []
for r in results_{{node_id}}:
    boxes = getattr(r, "boxes", None)
    if boxes is None:
        # Pure classification (no boxes) — emit one record per top class
        if hasattr(r, "probs") and r.probs is not None:
            top = int(r.probs.top1)
            cls_name = r.names[top]
            if not CLASSES_{{node_id}} or cls_name in CLASSES_{{node_id}}:
                dets_{{node_id}}.append({
                    "class": cls_name,
                    "confidence": float(r.probs.top1conf),
                    "bbox": None,
                    "track_id": None,
                })
        continue
    for i, b in enumerate(boxes):
        cls_name = r.names[int(b.cls[0])]
        if CLASSES_{{node_id}} and cls_name not in CLASSES_{{node_id}}:
            continue
        rec = {
            "class": cls_name,
            "confidence": float(b.conf[0]),
            "bbox": b.xyxy[0].tolist(),
            "track_id": int(b.id[0]) if (TRACKING_{{node_id}} and getattr(b, "id", None) is not None) else None,
        }
        # Task-specific extras
        if TASK_{{node_id}} == "segment" and getattr(r, "masks", None) is not None:
            try:
                rec["mask"] = r.masks.xy[i].tolist()
            except Exception:
                pass
        if TASK_{{node_id}} == "pose" and getattr(r, "keypoints", None) is not None:
            try:
                _kp_xy = r.keypoints.xy[i].tolist()
                # Pair each (x,y) with its COCO joint name; cap by available list length.
                rec["keypoints"] = [
                    {"name": POSE_KP_NAMES[j] if j < len(POSE_KP_NAMES) else f"kp_{j}",
                     "x": float(pt[0]), "y": float(pt[1])}
                    for j, pt in enumerate(_kp_xy)
                ]
            except Exception:
                pass
        if TASK_{{node_id}} == "obb" and getattr(r, "obb", None) is not None:
            try:
                rec["obb"] = r.obb.xyxyxyxy[i].tolist()
            except Exception:
                pass
        dets_{{node_id}}.append(rec)

# Build an annotated frame with bounding boxes / masks / keypoints / OBB / track IDs drawn.
# results[0].plot() returns a BGR numpy array with everything overlaid in YOLO's own style.
try:
    annotated_{{node_id}} = results_{{node_id}}[0].plot()
except Exception:
    annotated_{{node_id}} = frame_in

state["{{node_id}}"] = {
    "frame": frame_in,
    "annotated": annotated_{{node_id}},
    "detections": dets_{{node_id}},
    "task": TASK_{{node_id}},
    "tracking": TRACKING_{{node_id}},
    "fps": src.get("fps"),     # carry input FPS forward so downstream can size buffers
    "width": src.get("width"),
    "height": src.get("height"),
}
_inferred_{{node_id}} += 1
if _time_{{node_id}}.time() - _last_hb_y_{{node_id}} >= 1.0:
    print(f"@HB {{node_id_raw}} frames={_inferred_{{node_id}}} detections={len(dets_{{node_id}})}", flush=True)
    _last_hb_y_{{node_id}} = _time_{{node_id}}.time()
