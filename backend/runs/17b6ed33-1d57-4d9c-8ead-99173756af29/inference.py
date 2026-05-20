# AUTO-GENERATED — do not edit by hand
# Pipeline: Untitled pipeline

from collections import deque
from ultralytics import YOLO
import cv2
import json
import os
import time

PIPELINE_NAME = "Untitled pipeline"
state = {}

# ─── setup ─────────────────────────────────────────
# ── video_input (node-1) ──
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_node-1 = cv2.VideoCapture("D:\APEXNEURAL TRAIL\V\Vision-Project\visionai-platform\pipeline-builder-app\backend\uploads\1779172458842_cctv.mp4")
if not cap_node-1.isOpened():
    raise RuntimeError("Failed to open source: D:\APEXNEURAL TRAIL\V\Vision-Project\visionai-platform\pipeline-builder-app\backend\uploads\1779172458842_cctv.mp4")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_node-1 = cap_node-1.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_node-1 = float("5")
FRAME_STRIDE_node-1 = max(1, int(round(NATIVE_FPS_node-1 / TARGET_FPS_node-1)))
print(f"video_input node-1: native={NATIVE_FPS_node-1:.1f}fps target={TARGET_FPS_node-1}fps stride={FRAME_STRIDE_node-1}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_node-1, first_node-1 = cap_node-1.read()
if not ok_first_node-1:
    raise RuntimeError("Source opened but produced no frames: D:\APEXNEURAL TRAIL\V\Vision-Project\visionai-platform\pipeline-builder-app\backend\uploads\1779172458842_cctv.mp4")
SRC_H_node-1, SRC_W_node-1 = first_node-1.shape[:2]
print(f"video_input node-1: resolution {SRC_W_node-1}x{SRC_H_node-1}")
state["node-1"] = {"frame": first_node-1, "width": SRC_W_node-1, "height": SRC_H_node-1, "fps": TARGET_FPS_node-1}
_frame_idx_node-1 = 0

# ── yolo_model (node-2) ──
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into yolo26n-seg.pt.
model_node-2 = YOLO("yolo26n-seg.pt")
TASK_node-2 = "segment"
TRACKING_node-2 = True              # True to use model.track(), False for model()
CLASSES_node-2 = ["person"]                # list of class names to keep; empty list = all
CONF_node-2 = float("0.2")

# Auto-pick a CPU-friendly inference size (multiple of 32, between 320 and 640).
# Larger values are more accurate but slower; raise the cap if you have a GPU.
def _pick_imgsz_node-2(w, h):
    long_side = max(w, h)
    snapped = max(320, min(640, int(round(long_side / 32.0)) * 32))
    return snapped

# Tracking is only valid on detect / segment / pose models (per Ultralytics docs).
# If user asked for tracking on an incompatible task, fall back to plain inference.
if TRACKING_node-2 and TASK_node-2 not in ("detect", "segment", "pose"):
    print(f"yolo_model node-2: tracking not supported for task '{TASK_node-2}', falling back to inference.")
    TRACKING_node-2 = False

# ── condition (node-3) ──
COND_CLASSES_node-3 = ["person"]            # list, empty = any class
COND_MIN_CONF_node-3 = float("0.15")

# ── event_sink (node-4) ──
EVENTS_DIR_node-4 = "/events"
SAVE_SCREENSHOT_node-4 = True    # "True" / "False" injected by assembler
SAVE_CLIP_node-4       = True
CLIP_SECONDS_node-4    = int("10")
CLIP_FPS_node-4        = int("15")
COOLDOWN_S_node-4      = float("1")

os.makedirs(EVENTS_DIR_node-4, exist_ok=True)
events_index_path_node-4 = os.path.join(EVENTS_DIR_node-4, "events.jsonl")
buffer_node-4 = deque(maxlen=CLIP_FPS_node-4 * CLIP_SECONDS_node-4)
_last_fire_node-4 = 0.0


# ─── main loop ─────────────────────────────────────
while True:
    # ── video_input (node-1) ──
    _frame_idx_node-1 += 1
    ok_node-1, frame_node-1 = cap_node-1.read()
    if not ok_node-1:
        # End of file or stream — break for files, retry briefly for streams
        if "D:\APEXNEURAL TRAIL\V\Vision-Project\visionai-platform\pipeline-builder-app\backend\uploads\1779172458842_cctv.mp4".startswith("rtsp://"):
            time.sleep(0.5)
            continue
        break
    # FPS gate — only forward 1 in every FRAME_STRIDE frames
    if _frame_idx_node-1 % FRAME_STRIDE_node-1 != 0:
        continue
    state["node-1"] = {"frame": frame_node-1, "width": SRC_W_node-1, "height": SRC_H_node-1, "fps": TARGET_FPS_node-1}
    # ── yolo_model (node-2) ──
    src = state["node-1"]
    frame_in = src["frame"]
    imgsz_node-2 = _pick_imgsz_node-2(src["width"], src["height"])

    if TRACKING_node-2:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_node-2 = model_node-2.track(
            frame_in,
            conf=CONF_node-2,
            imgsz=imgsz_node-2,
            persist=True,
            verbose=False,
        )
    else:
        results_node-2 = model_node-2(
            frame_in,
            conf=CONF_node-2,
            imgsz=imgsz_node-2,
            verbose=False,
        )

    dets_node-2 = []
    for r in results_node-2:
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            # Pure classification (no boxes) — emit one record per top class
            if hasattr(r, "probs") and r.probs is not None:
                top = int(r.probs.top1)
                cls_name = r.names[top]
                if not CLASSES_node-2 or cls_name in CLASSES_node-2:
                    dets_node-2.append({
                        "class": cls_name,
                        "confidence": float(r.probs.top1conf),
                        "bbox": None,
                        "track_id": None,
                    })
            continue
        for i, b in enumerate(boxes):
            cls_name = r.names[int(b.cls[0])]
            if CLASSES_node-2 and cls_name not in CLASSES_node-2:
                continue
            rec = {
                "class": cls_name,
                "confidence": float(b.conf[0]),
                "bbox": b.xyxy[0].tolist(),
                "track_id": int(b.id[0]) if (TRACKING_node-2 and getattr(b, "id", None) is not None) else None,
            }
            # Task-specific extras
            if TASK_node-2 == "segment" and getattr(r, "masks", None) is not None:
                try:
                    rec["mask"] = r.masks.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node-2 == "pose" and getattr(r, "keypoints", None) is not None:
                try:
                    rec["keypoints"] = r.keypoints.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node-2 == "obb" and getattr(r, "obb", None) is not None:
                try:
                    rec["obb"] = r.obb.xyxyxyxy[i].tolist()
                except Exception:
                    pass
            dets_node-2.append(rec)

    # Build an annotated frame with bounding boxes / masks / keypoints / OBB / track IDs drawn.
    # results[0].plot() returns a BGR numpy array with everything overlaid in YOLO's own style.
    try:
        annotated_node-2 = results_node-2[0].plot()
    except Exception:
        annotated_node-2 = frame_in

    state["node-2"] = {
        "frame": frame_in,
        "annotated": annotated_node-2,
        "detections": dets_node-2,
        "task": TASK_node-2,
        "tracking": TRACKING_node-2,
    }
    # ── condition (node-3) ──
    upstream = state["node-2"]
    passing_node-3 = [
        d for d in upstream["detections"]
        if (not COND_CLASSES_node-3 or d["class"] in COND_CLASSES_node-3)
        and d["confidence"] >= COND_MIN_CONF_node-3
    ]
    state["node-3"] = {
        "frame": upstream["frame"],
        "annotated": upstream.get("annotated", upstream["frame"]),
        "detections": passing_node-3,
        "task": upstream.get("task"),
    }
    # ── event_sink (node-4) ──
    upstream = state["node-3"]
    # Use the annotated frame (with boxes/masks/keypoints drawn by YOLO's .plot()) when available.
    display_frame_node-4 = upstream.get("annotated") if isinstance(upstream, dict) and upstream.get("annotated") is not None else upstream["frame"]
    buffer_node-4.append(display_frame_node-4)

    if upstream["detections"]:
        now = time.time()
        if now - _last_fire_node-4 >= COOLDOWN_S_node-4:
            _last_fire_node-4 = now
            ts_ms = int(now * 1000)
            event_record = {
                "node": "node-4",
                "pipeline": PIPELINE_NAME,
                "triggered_at": now,
                "detections": upstream["detections"],
                "screenshot": None,
                "clip": None,
            }
            if SAVE_SCREENSHOT_node-4:
                shot_path = os.path.join(EVENTS_DIR_node-4, f"event_{ts_ms}.jpg")
                cv2.imwrite(shot_path, display_frame_node-4)
                event_record["screenshot"] = shot_path
            if SAVE_CLIP_node-4:
                h, w = display_frame_node-4.shape[:2]
                clip_path = os.path.join(EVENTS_DIR_node-4, f"event_{ts_ms}.mp4")
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(clip_path, fourcc, CLIP_FPS_node-4, (w, h))
                for f in list(buffer_node-4):
                    writer.write(f)
                writer.release()
                event_record["clip"] = clip_path
            with open(events_index_path_node-4, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(event_record) + "\n")
            print(f"event node-4: fired -> {event_record.get('screenshot') or event_record.get('clip')}")
            state["node-4"] = event_record
        else:
            state["node-4"] = None
    else:
        state["node-4"] = None
