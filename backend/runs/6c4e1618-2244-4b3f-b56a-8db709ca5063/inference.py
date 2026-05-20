# AUTO-GENERATED — do not edit by hand
# Pipeline: v5

from collections import deque
from ultralytics import YOLO
import cv2
import json
import os
import shutil
import subprocess
import time

PIPELINE_NAME = "v5"
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
TRACKING_node_2 = False              # True to use model.track(), False for model()
CLASSES_node_2 = ["person"]                # list of class names to keep; empty list = all
CONF_node_2 = float("0.25")

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

# Resolve class NAMES (e.g. ["person","car"]) to YOLO class INDICES so we can pass
# classes=[...] to inference. This is the correct way to filter: only the requested
# classes will be returned, AND results[0].plot() will only draw those boxes.
_name_to_id_node_2 = {v: int(k) for k, v in model_node_2.names.items()}
CLASS_IDS_node_2 = [_name_to_id_node_2[n] for n in CLASSES_node_2 if n in _name_to_id_node_2]
if CLASSES_node_2 and not CLASS_IDS_node_2:
    print(f"yolo_model node_2: WARNING none of {CLASSES_node_2} matched model classes; ignoring filter.")
_filter_desc_node_2 = CLASS_IDS_node_2 if CLASS_IDS_node_2 else "ALL"
print(f"yolo_model node_2: filtering to class ids {_filter_desc_node_2}")

# ── event_sink (node-3) ──
import atexit as _atexit_node_3
import signal as _signal_node_3

# Resolve ffmpeg binary for clip transcoding (so the browser can play the saved MP4).
try:
    import imageio_ffmpeg as _iio_ff_node_3
    _FFMPEG_EXE_node_3 = _iio_ff_node_3.get_ffmpeg_exe()
except Exception:
    _FFMPEG_EXE_node_3 = shutil.which("ffmpeg") or None

EVENTS_DIR_node_3 = "D:/APEXNEURAL TRAIL/V/Vision-Project/visionai-platform/pipeline-builder-app/backend/events"
SAVE_SCREENSHOT_node_3 = True    # "True" / "False" injected by assembler
SAVE_CLIP_node_3       = True
CLIP_SECONDS_node_3    = int("10")
CLIP_FPS_HINT_node_3   = int("15")           # advisory; we use the input FPS at runtime
COOLDOWN_S_node_3      = float("3")

os.makedirs(EVENTS_DIR_node_3, exist_ok=True)
events_index_path_node_3 = os.path.join(EVENTS_DIR_node_3, "events.jsonl")

# Buffers — sized from the input FPS once we see the first frame. These are reallocated
# the first time we get an upstream with a "fps" field so the clip duration matches real time.
_BUFFER_CAPACITY_node_3 = max(1, CLIP_FPS_HINT_node_3 * CLIP_SECONDS_node_3)
buffer_node_3 = deque(maxlen=_BUFFER_CAPACITY_node_3)
clip_meta_node_3 = deque(maxlen=_BUFFER_CAPACITY_node_3)
_pre_n_node_3  = _BUFFER_CAPACITY_node_3 // 2
_post_n_node_3 = _BUFFER_CAPACITY_node_3 - _pre_n_node_3
_buffer_sized_node_3 = False
_effective_fps_node_3 = float(CLIP_FPS_HINT_node_3)

# Active post-event captures. Each entry: (writer, remaining_frames, event_record, frames_meta)
_pending_clips_node_3 = []

_last_fire_node_3 = 0.0
_seen_e_node_3 = 0
_fired_node_3 = 0
_last_hb_e_node_3 = time.time()


def _flush_pending_clips_node_3():
    """Release every pending VideoWriter and transcode. Called on graceful shutdown."""
    for entry in list(_pending_clips_node_3):
        writer, _remaining, rec, _frames_meta = entry
        try: writer.release()
        except Exception: pass
        try:
            if rec.get("clip"):
                _transcode_to_h264_node_3(rec["clip"])
                print(f"event node_3: clip flushed on exit -> {rec['clip']}")
        except Exception as e:
            print(f"event node_3: flush failed: {e}")
    _pending_clips_node_3.clear()

_atexit_node_3.register(_flush_pending_clips_node_3)
try:
    _signal_node_3.signal(_signal_node_3.SIGTERM, lambda *_: (_flush_pending_clips_node_3(), os._exit(0)))
except Exception:
    pass  # SIGTERM may not be settable on Windows
try:
    _signal_node_3.signal(_signal_node_3.SIGINT, lambda *_: (_flush_pending_clips_node_3(), os._exit(0)))
except Exception:
    pass


def _try_h264_writer_node_3(path, fps, w, h):
    """OpenCV builds on Windows can't reliably write H.264 directly. We write with
    mp4v (always works) then transcode to H.264 after release so the browser plays it."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    wr = cv2.VideoWriter(path, fourcc, fps, (w, h))
    if not wr.isOpened():
        raise RuntimeError(f"VideoWriter could not open {path}")
    return wr


def _transcode_to_h264_node_3(path):
    """Re-encode the just-written MP4 to H.264 (baseline) so HTML5 <video> can play it.
    Falls back silently if ffmpeg isn't available."""
    if not _FFMPEG_EXE_node_3:
        return
    tmp = path + ".tmp.mp4"
    try:
        subprocess.run(
            [_FFMPEG_EXE_node_3, "-y", "-i", path, "-c:v", "libx264", "-preset", "veryfast",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", tmp],
            check=True, capture_output=True, timeout=60,
        )
        os.replace(tmp, path)
    except Exception as e:
        if os.path.exists(tmp):
            try: os.remove(tmp)
            except Exception: pass
        print(f"event node_3: transcode failed ({e}); keeping mp4v file")


def _flush_event_index_node_3(rec):
    with open(events_index_path_node_3, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")


# ─── main loop ─────────────────────────────────────
while not _SHOULD_EXIT:
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

    # Build kwargs once so we can pass classes= only when there's a filter
    _kwargs_node_2 = dict(conf=CONF_node_2, imgsz=imgsz_node_2, verbose=False)
    if CLASS_IDS_node_2:
        _kwargs_node_2["classes"] = CLASS_IDS_node_2

    if TRACKING_node_2:
        # persist=True maintains object IDs across frames (required for ID continuity).
        results_node_2 = model_node_2.track(frame_in, persist=True, **_kwargs_node_2)
    else:
        results_node_2 = model_node_2(frame_in, **_kwargs_node_2)

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
        "fps": src.get("fps"),     # carry input FPS forward so downstream can size buffers
        "width": src.get("width"),
        "height": src.get("height"),
    }
    _inferred_node_2 += 1
    if _time_node_2.time() - _last_hb_y_node_2 >= 1.0:
        print(f"@HB node-2 frames={_inferred_node_2} detections={len(dets_node_2)}", flush=True)
        _last_hb_y_node_2 = _time_node_2.time()
    # ── event_sink (node-3) ──
    upstream = state["node_2"]
    # Annotated frame (with bounding boxes) when available
    display_frame_node_3 = upstream.get("annotated") if isinstance(upstream, dict) and upstream.get("annotated") is not None else upstream["frame"]
    _now_loop_node_3 = time.time()

    # First-frame buffer sizing: resize to input FPS * clip_seconds so a 10s clip is really 10s.
    if not _buffer_sized_node_3 and isinstance(upstream, dict) and upstream.get("fps"):
        _effective_fps_node_3 = max(1.0, float(upstream["fps"]))
        _cap = int(_effective_fps_node_3 * CLIP_SECONDS_node_3)
        _cap = max(2, _cap)
        buffer_node_3 = deque(buffer_node_3, maxlen=_cap)
        clip_meta_node_3 = deque(clip_meta_node_3, maxlen=_cap)
        _pre_n_node_3  = _cap // 2
        _post_n_node_3 = _cap - _pre_n_node_3
        _buffer_sized_node_3 = True
        print(f"event node_3: clip buffer sized to {_cap} frames @ {_effective_fps_node_3:.1f}fps (pre={_pre_n_node_3}, post={_post_n_node_3})")

    buffer_node_3.append(display_frame_node_3)
    clip_meta_node_3.append({"t": _now_loop_node_3, "detections": upstream.get("detections", [])})
    _seen_e_node_3 += 1

    # Advance any in-progress post-event captures by appending this frame.
    _still_pending_node_3 = []
    for entry in _pending_clips_node_3:
        writer, remaining, rec, frames_meta = entry
        writer.write(display_frame_node_3)
        frames_meta.append({"t": _now_loop_node_3, "detections": upstream.get("detections", [])})
        remaining -= 1
        if remaining > 0:
            _still_pending_node_3.append((writer, remaining, rec, frames_meta))
        else:
            writer.release()
            # Re-encode to H.264 so HTML5 <video> can play it natively
            _transcode_to_h264_node_3(rec["clip"])
            # Update the sidecar with the full pre+post frame list
            if rec.get("clip_meta"):
                meta_doc = {
                    "event_ts": rec["triggered_at"],
                    "clip_path": rec["clip"],
                    "clip_fps": _effective_fps_node_3,
                    "clip_seconds": CLIP_SECONDS_node_3,
                    "frame_count": len(frames_meta),
                    "frames": list(frames_meta),
                }
                with open(rec["clip_meta"], "w", encoding="utf-8") as mfh:
                    json.dump(meta_doc, mfh)
            print(f"event node_3: clip finalized -> {rec['clip']}")
    _pending_clips_node_3 = _still_pending_node_3

    # Trigger evaluation
    if upstream["detections"]:
        now = _now_loop_node_3
        if now - _last_fire_node_3 >= COOLDOWN_S_node_3:
            _last_fire_node_3 = now
            _fired_node_3 += 1
            ts_ms = int(now * 1000)
            event_record = {
                "node": "node_3",
                "pipeline": PIPELINE_NAME,
                "triggered_at": now,
                "detections": upstream["detections"],
                "screenshot": None,
                "clip": None,
                "clip_meta": None,
            }
            if SAVE_SCREENSHOT_node_3:
                shot_path = os.path.join(EVENTS_DIR_node_3, f"event_{ts_ms}.jpg")
                cv2.imwrite(shot_path, display_frame_node_3)
                event_record["screenshot"] = shot_path
            if SAVE_CLIP_node_3:
                h, w = display_frame_node_3.shape[:2]
                clip_path = os.path.join(EVENTS_DIR_node_3, f"event_{ts_ms}.mp4")
                meta_path = os.path.join(EVENTS_DIR_node_3, f"event_{ts_ms}.json")
                writer = _try_h264_writer_node_3(clip_path, _effective_fps_node_3, w, h)
                # Write the pre-buffer (history) frames first
                pre_meta_node_3 = list(clip_meta_node_3)
                for f in list(buffer_node_3):
                    writer.write(f)
                event_record["clip"] = clip_path
                event_record["clip_meta"] = meta_path
                # Schedule post-event frames to be written as the loop continues
                _pending_clips_node_3.append((writer, _post_n_node_3, event_record, pre_meta_node_3))
            _flush_event_index_node_3(event_record)
            print(f"event node_3: fired -> {event_record.get('screenshot') or event_record.get('clip')}")
            state["node_3"] = event_record
        else:
            state["node_3"] = None
    else:
        state["node_3"] = None

    if time.time() - _last_hb_e_node_3 >= 1.0:
        print(f"@HB node-3 frames={_seen_e_node_3} fired={_fired_node_3}", flush=True)
        _last_hb_e_node_3 = time.time()

# Graceful exit — atexit handlers in event_sink will flush pending clips.
print("[runtime] stop requested, flushing...", flush=True)