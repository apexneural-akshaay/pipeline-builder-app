# AUTO-GENERATED — do not edit by hand
# Pipeline: Untitled pipeline

from ultralytics import YOLO
import cv2
import time

PIPELINE_NAME = "Untitled pipeline"
state = {}

# ─── setup ─────────────────────────────────────────
# ── video_input (node-1) ──
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_node_1 = cv2.VideoCapture("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779182169943_cctv.mp4")
if not cap_node_1.isOpened():
    raise RuntimeError("Failed to open source: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779182169943_cctv.mp4")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_node_1 = cap_node_1.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_node_1 = float("5")
FRAME_STRIDE_node_1 = max(1, int(round(NATIVE_FPS_node_1 / TARGET_FPS_node_1)))
print(f"video_input node_1: native={NATIVE_FPS_node_1:.1f}fps target={TARGET_FPS_node_1}fps stride={FRAME_STRIDE_node_1}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_node_1, first_node_1 = cap_node_1.read()
if not ok_first_node_1:
    raise RuntimeError("Source opened but produced no frames: D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779182169943_cctv.mp4")
SRC_H_node_1, SRC_W_node_1 = first_node_1.shape[:2]
print(f"video_input node_1: resolution {SRC_W_node_1}x{SRC_H_node_1}")
state["node_1"] = {"frame": first_node_1, "width": SRC_W_node_1, "height": SRC_H_node_1, "fps": TARGET_FPS_node_1}
_frame_idx_node_1 = 0
_emitted_node_1 = 0
_last_hb_node_1 = time.time()

# ── yolo_model (node-2) ──
# Resolved weight file. Backend assembler picks the right name (yolo26n.pt, yolo26n-seg.pt etc.)
# based on version + task + size and writes it into D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt.
model_node_2 = YOLO("D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/models/yolo26n.pt")
TASK_node_2 = "detect"
TRACKING_node_2 = True              # True to use model.track(), False for model()
CLASSES_node_2 = ["handbag","suitcase","backpack","bottle","laptop","tv"]                # list of class names to keep; empty list = all
CONF_node_2 = float("0.2")

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

import time as _time_node_2
_inferred_node_2 = 0
_last_hb_y_node_2 = _time_node_2.time()


# ─── main loop ─────────────────────────────────────
while True:
    # ── video_input (node-1) ──
    _frame_idx_node_1 += 1
    ok_node_1, frame_node_1 = cap_node_1.read()
    if not ok_node_1:
        # End of file or stream — break for files, retry briefly for streams
        if "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/uploads/1779182169943_cctv.mp4".startswith("rtsp://"):
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
    _inferred_node_2 += 1
    if _time_node_2.time() - _last_hb_y_node_2 >= 1.0:
        print(f"@HB node-2 frames={_inferred_node_2} detections={len(dets_node_2)}", flush=True)
        _last_hb_y_node_2 = _time_node_2.time()
