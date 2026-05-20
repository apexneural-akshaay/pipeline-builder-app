# AUTO-GENERATED — do not edit by hand
# Pipeline: e2e_real

from collections import deque
from ultralytics import YOLO
import cv2
import json
import os
import time

PIPELINE_NAME = "e2e_real"
state = {}

# ─── setup ─────────────────────────────────────────
# ── video_input (node-1) ──
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_node_1 = cv2.VideoCapture("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779172991569_cctv.mp4")
if not cap_node_1.isOpened():
    raise RuntimeError("Failed to open source: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779172991569_cctv.mp4")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_node_1 = cap_node_1.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_node_1 = float("2")
FRAME_STRIDE_node_1 = max(1, int(round(NATIVE_FPS_node_1 / TARGET_FPS_node_1)))
print(f"video_input node_1: native={NATIVE_FPS_node_1:.1f}fps target={TARGET_FPS_node_1}fps stride={FRAME_STRIDE_node_1}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_node_1, first_node_1 = cap_node_1.read()
if not ok_first_node_1:
    raise RuntimeError("Source opened but produced no frames: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779172991569_cctv.mp4")
SRC_H_node_1, SRC_W_node_1 = first_node_1.shape[:2]
print(f"video_input node_1: resolution {SRC_W_node_1}x{SRC_H_node_1}")
state["node_1"] = {"frame": first_node_1, "width": SRC_W_node_1, "height": SRC_H_node_1, "fps": TARGET_FPS_node_1}
_frame_idx_node_1 = 0

# ── yolo_model (node-2) ──
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt.
model_node_2 = YOLO("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt")
TASK_node_2 = "detect"
TRACKING_node_2 = False              # True to use model.track(), False for model()
CLASSES_node_2 = ["person"]                # list of class names to keep; empty list = all
CONF_node_2 = float("0.3")

# Auto-pick a CPU-friendly inference size (multiple of 32, between 320 and 640).
# Larger values are more accurate but slower; raise the cap if you have a GPU.
def _pick_imgsz_node_2(w, h):
    long_side = max(w, h)
    snapped = max(320, min(640, int(round(long_side / 32.0)) * 32))
    return snapped

# Tracking is only valid on detect / segment / pose models (per Ultralytics docs).
# If user asked for tracking on an incompatible task, fall back to plain inference.
if TRACKING_node_2 and TASK_node_2 not in ("detect", "segment", "pose"):
    print(f"yolo_model node_2: tracking not supported for task '{TASK_node_2}', falling back to inference.")
    TRACKING_node_2 = False

# ── event_sink (node-3) ──
EVENTS_DIR_node_3 = "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/events"
SAVE_SCREENSHOT_node_3 = True    # "True" / "False" injected by assembler
SAVE_CLIP_node_3       = False
CLIP_SECONDS_node_3    = int("5")
CLIP_FPS_node_3        = int("15")
COOLDOWN_S_node_3      = float("2")

os.makedirs(EVENTS_DIR_node_3, exist_ok=True)
events_index_path_node_3 = os.path.join(EVENTS_DIR_node_3, "events.jsonl")
buffer_node_3 = deque(maxlen=CLIP_FPS_node_3 * CLIP_SECONDS_node_3)
_last_fire_node_3 = 0.0


# ─── main loop ─────────────────────────────────────
while True:
    # ── video_input (node-1) ──
    _frame_idx_node_1 += 1
    ok_node_1, frame_node_1 = cap_node_1.read()
    if not ok_node_1:
        # End of file or stream — break for files, retry briefly for streams
        if "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779172991569_cctv.mp4".startswith("rtsp://"):
            time.sleep(0.5)
            continue
        break
    # FPS gate — only forward 1 in every FRAME_STRIDE frames
    if _frame_idx_node_1 % FRAME_STRIDE_node_1 != 0:
        continue
    state["node_1"] = {"frame": frame_node_1, "width": SRC_W_node_1, "height": SRC_H_node_1, "fps": TARGET_FPS_node_1}
    # ── yolo_model (node-2) ──
    src = state["node_1"]
    frame_in = src["frame"]
    imgsz_node_2 = _pick_imgsz_node_2(src["width"], src["height"])

    if TRACKING_node_2:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_node_2 = model_node_2.track(
            frame_in,
            conf=CONF_node_2,
            imgsz=imgsz_node_2,
            persist=True,
            verbose=False,
        )
    else:
        results_node_2 = model_node_2(
            frame_in,
            conf=CONF_node_2,
            imgsz=imgsz_node_2,
            verbose=False,
        )

    dets_node_2 = []
    for r in results_node_2:
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            # Pure classification (no boxes) — emit one record per top class
            if hasattr(r, "probs") and r.probs is not None:
                top = int(r.probs.top1)
                cls_name = r.names[top]
                if not CLASSES_node_2 or cls_name in CLASSES_node_2:
                    dets_node_2.append({
                        "class": cls_name,
                        "confidence": float(r.probs.top1conf),
                        "bbox": None,
                        "track_id": None,
                    })
            continue
        for i, b in enumerate(boxes):
            cls_name = r.names[int(b.cls[0])]
            if CLASSES_node_2 and cls_name not in CLASSES_node_2:
                continue
            rec = {
                "class": cls_name,
                "confidence": float(b.conf[0]),
                "bbox": b.xyxy[0].tolist(),
                "track_id": int(b.id[0]) if (TRACKING_node_2 and getattr(b, "id", None) is not None) else None,
            }
            # Task-specific extras
            if TASK_node_2 == "segment" and getattr(r, "masks", None) is not None:
                try:
                    rec["mask"] = r.masks.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node_2 == "pose" and getattr(r, "keypoints", None) is not None:
                try:
                    rec["keypoints"] = r.keypoints.xy[i].tolist()
                except Exception:
                    pass
            if TASK_node_2 == "obb" and getattr(r, "obb", None) is not None:
                try:
                    rec["obb"] = r.obb.xyxyxyxy[i].tolist()
                except Exception:
                    pass
            dets_node_2.append(rec)

    # Build an annotated frame with bounding boxes / masks / keypoints / OBB / track IDs drawn.
    # results[0].plot() returns a BGR numpy array with everything overlaid in YOLO's own style.
    try:
        annotated_node_2 = results_node_2[0].plot()
    except Exception:
        annotated_node_2 = frame_in

    state["node_2"] = {
        "frame": frame_in,
        "annotated": annotated_node_2,
        "detections": dets_node_2,
        "task": TASK_node_2,
        "tracking": TRACKING_node_2,
    }
    # ── event_sink (node-3) ──
    upstream = state["node_2"]
    # Use the annotated frame (with boxes/masks/keypoints drawn by YOLO's .plot()) when available.
    display_frame_node_3 = upstream.get("annotated") if isinstance(upstream, dict) and upstream.get("annotated") is not None else upstream["frame"]
    buffer_node_3.append(display_frame_node_3)

    if upstream["detections"]:
        now = time.time()
        if now - _last_fire_node_3 >= COOLDOWN_S_node_3:
            _last_fire_node_3 = now
            ts_ms = int(now * 1000)
            event_record = {
                "node": "node_3",
                "pipeline": PIPELINE_NAME,
                "triggered_at": now,
                "detections": upstream["detections"],
                "screenshot": None,
                "clip": None,
            }
            if SAVE_SCREENSHOT_node_3:
                shot_path = os.path.join(EVENTS_DIR_node_3, f"event_{ts_ms}.jpg")
                cv2.imwrite(shot_path, display_frame_node_3)
                event_record["screenshot"] = shot_path
            if SAVE_CLIP_node_3:
                h, w = display_frame_node_3.shape[:2]
                clip_path = os.path.join(EVENTS_DIR_node_3, f"event_{ts_ms}.mp4")
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(clip_path, fourcc, CLIP_FPS_node_3, (w, h))
                for f in list(buffer_node_3):
                    writer.write(f)
                writer.release()
                event_record["clip"] = clip_path
            with open(events_index_path_node_3, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(event_record) + "\n")
            print(f"event node_3: fired -> {event_record.get('screenshot') or event_record.get('clip')}")
            state["node_3"] = event_record
        else:
            state["node_3"] = None
    else:
        state["node_3"] = None
