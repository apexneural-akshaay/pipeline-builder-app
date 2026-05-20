# AUTO-GENERATED — do not edit by hand
# Pipeline: Untitled pipeline

from ultralytics import YOLO
import cv2
import time

PIPELINE_NAME = "Untitled pipeline"
state = {}

# ─── stdin shutdown watcher ──────────────────────
# Listen for a "__STOP__" line on stdin so the host can request a graceful exit
# (lets event_sink flush pending VideoWriters and transcode before quitting).
import sys as _sys, threading as _threading
_SHOULD_EXIT = False
def _stdin_watcher():
    global _SHOULD_EXIT
    try:
        for line in _sys.stdin:
            if line.strip() == "__STOP__":
                _SHOULD_EXIT = True
                return
    except Exception:
        pass
_threading.Thread(target=_stdin_watcher, daemon=True).start()

# ─── setup ─────────────────────────────────────────
# ── video_input (node-1) ──
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_node_1 = cv2.VideoCapture("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779175888537_cctv.mp4")
if not cap_node_1.isOpened():
    raise RuntimeError("Failed to open source: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779175888537_cctv.mp4")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_node_1 = cap_node_1.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_node_1 = float("5")
FRAME_STRIDE_node_1 = max(1, int(round(NATIVE_FPS_node_1 / TARGET_FPS_node_1)))
print(f"video_input node_1: native={NATIVE_FPS_node_1:.1f}fps target={TARGET_FPS_node_1}fps stride={FRAME_STRIDE_node_1}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_node_1, first_node_1 = cap_node_1.read()
if not ok_first_node_1:
    raise RuntimeError("Source opened but produced no frames: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779175888537_cctv.mp4")
SRC_H_node_1, SRC_W_node_1 = first_node_1.shape[:2]
print(f"video_input node_1: resolution {SRC_W_node_1}x{SRC_H_node_1}")
state["node_1"] = {"frame": first_node_1, "width": SRC_W_node_1, "height": SRC_H_node_1, "fps": TARGET_FPS_node_1}
_frame_idx_node_1 = 0
_emitted_node_1 = 0
_last_hb_node_1 = time.time()

# ── yolo_model (node-3) ──
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt.
model_node_3 = YOLO("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt")
TASK_node_3 = "detect"
TRACKING_node_3 = True              # True to use model.track(), False for model()
CLASSES_node_3 = ["bag","handbag","suitcase"]                # list of class names to keep; empty list = all
CONF_node_3 = float("0.2")

# Auto-pick a CPU-friendly inference size (multiple of 32, between 320 and 640).
# Larger values are more accurate but slower; raise the cap if you have a GPU.
def _pick_imgsz_node_3(w, h):
    long_side = max(w, h)
    snapped = max(320, min(640, int(round(long_side / 32.0)) * 32))
    return snapped

# Tracking is only valid on detect / segment / pose models (per Ultralytics docs).
# If user asked for tracking on an incompatible task, fall back to plain inference.
if TRACKING_node_3 and TASK_node_3 not in ("detect", "segment", "pose"):
    print(f"yolo_model node_3: tracking not supported for task '{TASK_node_3}', falling back to inference.")
    TRACKING_node_3 = False

import time as _time_node_3
_inferred_node_3 = 0
_last_hb_y_node_3 = _time_node_3.time()

# Resolve class NAMES (e.g. ["person","car"]) to YOLO class INDICES so we can pass
# classes=[...] to inference. This is the correct way to filter: only the requested
# classes will be returned, AND results[0].plot() will only draw those boxes.
_name_to_id_node_3 = {v: int(k) for k, v in model_node_3.names.items()}
CLASS_IDS_node_3 = [_name_to_id_node_3[n] for n in CLASSES_node_3 if n in _name_to_id_node_3]
if CLASSES_node_3 and not CLASS_IDS_node_3:
    print(f"yolo_model node_3: WARNING none of {CLASSES_node_3} matched model classes; ignoring filter.")
_filter_desc_node_3 = CLASS_IDS_node_3 if CLASS_IDS_node_3 else "ALL"
print(f"yolo_model node_3: filtering to class ids {_filter_desc_node_3}")


# ─── main loop ─────────────────────────────────────
while not _SHOULD_EXIT:
    # ── video_input (node-1) ──
    _frame_idx_node_1 += 1
    ok_node_1, frame_node_1 = cap_node_1.read()
    if not ok_node_1:
        # End of file or stream — break for files, retry briefly for streams
        if "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779175888537_cctv.mp4".startswith("rtsp://"):
            time.sleep(0.5)
            continue
        break
    # FPS gate — only forward 1 in every FRAME_STRIDE frames
    if _frame_idx_node_1 % FRAME_STRIDE_node_1 != 0:
        continue
    state["node_1"] = {"frame": frame_node_1, "width": SRC_W_node_1, "height": SRC_H_node_1, "fps": TARGET_FPS_node_1}
    _emitted_node_1 += 1
    if time.time() - _last_hb_node_1 >= 1.0:
        print(f"@HB node-1 frames={_emitted_node_1}", flush=True)
        _last_hb_node_1 = time.time()
    # ── yolo_model (node-3) ──
    src = state["node_1"]
    frame_in = src["frame"]
    imgsz_node_3 = _pick_imgsz_node_3(src["width"], src["height"])

    # Build kwargs once so we can pass classes= only when there's a filter
    _kwargs_node_3 = dict(conf=CONF_node_3, imgsz=imgsz_node_3, verbose=False)
    if CLASS_IDS_node_3:
        _kwargs_node_3["classes"] = CLASS_IDS_node_3

    if TRACKING_node_3:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_node_3 = model_node_3.track(frame_in, persist=True, **_kwargs_node_3)
    else:
        results_node_3 = model_node_3(frame_in, **_kwargs_node_3)

    dets_node_3 = []
    for r in results_node_3:
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            # Pure classification (no boxes) — emit one record per top class
            if hasattr(r, "probs") and r.probs is not None:
                top = int(r.probs.top1)
                cls_name = r.names[top]
                if not CLASSES_node_3 or cls_name in CLASSES_node_3:
                    dets_node_3.append({
                        "class": cls_name,
                        "confidence": float(r.probs.top1conf),
                        "bbox": None,
                        "track_id": None,
                    })
            continue
        for i, b in enumerate(boxes):
            cls_name = r.names[int(b.cls[0])]
            if CLASSES_node_3 and cls_name not in CLASSES_node_3:
                continue
            rec = {
                "class": cls_name,
                "confidence": float(b.conf[0]),
                "bbox": b.xyxy[0].tolist(),
                "track_id": int(b.id[0]) if (TRACKING_node_3 and getattr(b, "id", None) is not None) else None,
            }
            # Task-specific extras
            if TASK_node_3 == "segment" and getattr(r, "masks", None) is not None:
                try:
                    rec["mask"] = r.masks.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node_3 == "pose" and getattr(r, "keypoints", None) is not None:
                try:
                    rec["keypoints"] = r.keypoints.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node_3 == "obb" and getattr(r, "obb", None) is not None:
                try:
                    rec["obb"] = r.obb.xyxyxyxy[i].tolist()
                except Exception:
                    pass
            dets_node_3.append(rec)

    # Build an annotated frame with bounding boxes / masks / keypoints / OBB / track IDs drawn.
    # results[0].plot() returns a BGR numpy array with everything overlaid in YOLO's own style.
    try:
        annotated_node_3 = results_node_3[0].plot()
    except Exception:
        annotated_node_3 = frame_in

    state["node_3"] = {
        "frame": frame_in,
        "annotated": annotated_node_3,
        "detections": dets_node_3,
        "task": TASK_node_3,
        "tracking": TRACKING_node_3,
        "fps": src.get("fps"),     # carry input FPS forward so downstream can size buffers
        "width": src.get("width"),
        "height": src.get("height"),
    }
    _inferred_node_3 += 1
    if _time_node_3.time() - _last_hb_y_node_3 >= 1.0:
        print(f"@HB node-3 frames={_inferred_node_3} detections={len(dets_node_3)}", flush=True)
        _last_hb_y_node_3 = _time_node_3.time()

# Graceful exit — atexit handlers in event_sink will flush pending clips.
print("[runtime] stop requested, flushing...", flush=True)