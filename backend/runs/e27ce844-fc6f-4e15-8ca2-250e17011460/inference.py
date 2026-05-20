# AUTO-GENERATED — do not edit by hand
# Pipeline: e2e_run

from collections import deque
from ultralytics import YOLO
import cv2
import json
import os
import time

PIPELINE_NAME = "e2e_run"
state = {}

# ─── setup ─────────────────────────────────────────
# ── video_input (i) ──
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_i = cv2.VideoCapture("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779104072028_cctv.mp4")
if not cap_i.isOpened():
    raise RuntimeError("Failed to open source: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779104072028_cctv.mp4")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_i = cap_i.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_i = float("2")
FRAME_STRIDE_i = max(1, int(round(NATIVE_FPS_i / TARGET_FPS_i)))
print(f"video_input i: native={NATIVE_FPS_i:.1f}fps target={TARGET_FPS_i}fps stride={FRAME_STRIDE_i}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_i, first_i = cap_i.read()
if not ok_first_i:
    raise RuntimeError("Source opened but produced no frames: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779104072028_cctv.mp4")
SRC_H_i, SRC_W_i = first_i.shape[:2]
print(f"video_input i: resolution {SRC_W_i}x{SRC_H_i}")
state["i"] = {"frame": first_i, "width": SRC_W_i, "height": SRC_H_i, "fps": TARGET_FPS_i}
_frame_idx_i = 0

# ── yolo_model (m) ──
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into yolo26n.pt.
model_m = YOLO("yolo26n.pt")
TASK_m = "detect"
TRACKING_m = False              # True to use model.track(), False for model()
CLASSES_m = ["person"]                # list of class names to keep; empty list = all
CONF_m = float("0.3")

# Auto-pick a sensible inference image size based on the source resolution
# (rounded to nearest multiple of 32, capped between 320 and 1280).
def _pick_imgsz_m(w, h):
    long_side = max(w, h)
    snapped = max(320, min(1280, int(round(long_side / 32.0)) * 32))
    return snapped

# Tracking is only valid on detect / segment / pose models (per Ultralytics docs).
# If user asked for tracking on an incompatible task, fall back to plain inference.
if TRACKING_m and TASK_m not in ("detect", "segment", "pose"):
    print(f"yolo_model m: tracking not supported for task '{TASK_m}', falling back to inference.")
    TRACKING_m = False

# ── event_sink (e) ──
EVENTS_DIR_e = "./events"
SAVE_SCREENSHOT_e = True    # "True" / "False" injected by assembler
SAVE_CLIP_e       = False
CLIP_SECONDS_e    = int("5")
CLIP_FPS_e        = int("15")
COOLDOWN_S_e      = float("2")

os.makedirs(EVENTS_DIR_e, exist_ok=True)
events_index_path_e = os.path.join(EVENTS_DIR_e, "events.jsonl")
buffer_e = deque(maxlen=CLIP_FPS_e * CLIP_SECONDS_e)
_last_fire_e = 0.0


# ─── main loop ─────────────────────────────────────
while True:
    # ── video_input (i) ──
    _frame_idx_i += 1
    ok_i, frame_i = cap_i.read()
    if not ok_i:
        # End of file or stream — break for files, retry briefly for streams
        if "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779104072028_cctv.mp4".startswith("rtsp://"):
            time.sleep(0.5)
            continue
        break
    # FPS gate — only forward 1 in every FRAME_STRIDE frames
    if _frame_idx_i % FRAME_STRIDE_i != 0:
        continue
    state["i"] = {"frame": frame_i, "width": SRC_W_i, "height": SRC_H_i, "fps": TARGET_FPS_i}
    # ── yolo_model (m) ──
    src = state["i"]
    frame_in = src["frame"]
    imgsz_m = _pick_imgsz_m(src["width"], src["height"])

    if TRACKING_m:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_m = model_m.track(
            frame_in,
            conf=CONF_m,
            imgsz=imgsz_m,
            persist=True,
            verbose=False,
        )
    else:
        results_m = model_m(
            frame_in,
            conf=CONF_m,
            imgsz=imgsz_m,
            verbose=False,
        )

    dets_m = []
    for r in results_m:
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            # Pure classification (no boxes) — emit one record per top class
            if hasattr(r, "probs") and r.probs is not None:
                top = int(r.probs.top1)
                cls_name = r.names[top]
                if not CLASSES_m or cls_name in CLASSES_m:
                    dets_m.append({
                        "class": cls_name,
                        "confidence": float(r.probs.top1conf),
                        "bbox": None,
                        "track_id": None,
                    })
            continue
        for i, b in enumerate(boxes):
            cls_name = r.names[int(b.cls[0])]
            if CLASSES_m and cls_name not in CLASSES_m:
                continue
            rec = {
                "class": cls_name,
                "confidence": float(b.conf[0]),
                "bbox": b.xyxy[0].tolist(),
                "track_id": int(b.id[0]) if (TRACKING_m and getattr(b, "id", None) is not None) else None,
            }
            # Task-specific extras
            if TASK_m == "segment" and getattr(r, "masks", None) is not None:
                try:
                    rec["mask"] = r.masks.xy[i].tolist()
                except Exception:
                    pass
            if TASK_m == "pose" and getattr(r, "keypoints", None) is not None:
                try:
                    rec["keypoints"] = r.keypoints.xy[i].tolist()
                except Exception:
                    pass
            if TASK_m == "obb" and getattr(r, "obb", None) is not None:
                try:
                    rec["obb"] = r.obb.xyxyxyxy[i].tolist()
                except Exception:
                    pass
            dets_m.append(rec)

    state["m"] = {
        "frame": frame_in,
        "detections": dets_m,
        "task": TASK_m,
        "tracking": TRACKING_m,
    }
    # ── event_sink (e) ──
    upstream = state["m"]
    buffer_e.append(upstream["frame"])

    if upstream["detections"]:
        now = time.time()
        if now - _last_fire_e >= COOLDOWN_S_e:
            _last_fire_e = now
            ts_ms = int(now * 1000)
            event_record = {
                "node": "e",
                "pipeline": PIPELINE_NAME,
                "triggered_at": now,
                "detections": upstream["detections"],
                "screenshot": None,
                "clip": None,
            }
            if SAVE_SCREENSHOT_e:
                shot_path = os.path.join(EVENTS_DIR_e, f"event_{ts_ms}.jpg")
                cv2.imwrite(shot_path, upstream["frame"])
                event_record["screenshot"] = shot_path
            if SAVE_CLIP_e:
                h, w = upstream["frame"].shape[:2]
                clip_path = os.path.join(EVENTS_DIR_e, f"event_{ts_ms}.mp4")
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(clip_path, fourcc, CLIP_FPS_e, (w, h))
                for f in list(buffer_e):
                    writer.write(f)
                writer.release()
                event_record["clip"] = clip_path
            with open(events_index_path_e, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(event_record) + "\n")
            print(f"event e: fired -> {event_record.get('screenshot') or event_record.get('clip')}")
            state["e"] = event_record
        else:
            state["e"] = None
    else:
        state["e"] = None
