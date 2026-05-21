# [imports]
import os
import json
import time
import shutil
import subprocess
import cv2
from collections import deque

# [setup]
import atexit as _atexit_{{node_id}}
import signal as _signal_{{node_id}}

# ffmpeg is required for H.264 clip output (browser-playable).
try:
    import imageio_ffmpeg as _iio_ff_{{node_id}}
    _FFMPEG_EXE_{{node_id}} = _iio_ff_{{node_id}}.get_ffmpeg_exe()
except Exception:
    _FFMPEG_EXE_{{node_id}} = shutil.which("ffmpeg") or None

EVENTS_DIR_{{node_id}} = "{{output_dir}}"
SAVE_SCREENSHOT_{{node_id}} = {{save_screenshot}}
SAVE_CLIP_{{node_id}}       = {{save_clip}}
CLIP_SECONDS_{{node_id}}    = int("{{clip_seconds}}")
CLIP_FPS_HINT_{{node_id}}   = int("{{clip_fps}}")
COOLDOWN_S_{{node_id}}      = float("{{cooldown_seconds}}")

os.makedirs(EVENTS_DIR_{{node_id}}, exist_ok=True)
events_index_path_{{node_id}} = os.path.join(EVENTS_DIR_{{node_id}}, "events.jsonl")

# Ring buffer of recent ANNOTATED frames so we can include "before the event" footage
# in the clip. Sized after we see the first frame using the actual processing FPS.
_BUFFER_CAPACITY_{{node_id}} = max(2, CLIP_FPS_HINT_{{node_id}} * CLIP_SECONDS_{{node_id}})
buffer_{{node_id}} = deque(maxlen=_BUFFER_CAPACITY_{{node_id}})
clip_meta_{{node_id}} = deque(maxlen=_BUFFER_CAPACITY_{{node_id}})
_pre_n_{{node_id}}  = _BUFFER_CAPACITY_{{node_id}} // 2
_post_n_{{node_id}} = _BUFFER_CAPACITY_{{node_id}} - _pre_n_{{node_id}}
_buffer_sized_{{node_id}} = False
_effective_fps_{{node_id}} = float(CLIP_FPS_HINT_{{node_id}})

_pending_clips_{{node_id}} = []   # active post-event captures

_last_fire_{{node_id}} = 0.0
_seen_e_{{node_id}} = 0
_fired_{{node_id}} = 0
_last_hb_e_{{node_id}} = time.time()


class _FfmpegWriter_{{node_id}}:
    """Pipes raw BGR frames to ffmpeg, producing browser-playable H.264 (+faststart)."""

    def __init__(self, path, fps, w, h):
        if not _FFMPEG_EXE_{{node_id}}:
            raise RuntimeError("ffmpeg not available; cannot write clip")
        self.path = path
        self.w, self.h = int(w), int(h)
        self.closed = False
        fps_str = f"{max(1.0, float(fps)):.3f}"
        self.proc = subprocess.Popen(
            [
                _FFMPEG_EXE_{{node_id}},
                "-y", "-loglevel", "error",
                "-f", "rawvideo", "-vcodec", "rawvideo",
                "-pix_fmt", "bgr24",
                "-s", f"{self.w}x{self.h}",
                "-framerate", fps_str,
                "-i", "-",
                "-c:v", "libx264", "-preset", "ultrafast",
                "-pix_fmt", "yuv420p",
                "-r", fps_str, "-vsync", "cfr",
                "-movflags", "+faststart",
                "-an",
                path,
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    def write(self, frame):
        if self.closed or self.proc.stdin is None:
            return
        if frame.shape[1] != self.w or frame.shape[0] != self.h:
            frame = cv2.resize(frame, (self.w, self.h))
        try:
            self.proc.stdin.write(frame.tobytes())
        except BrokenPipeError:
            self.closed = True

    def release(self):
        if self.closed:
            return
        self.closed = True
        try:
            if self.proc.stdin:
                self.proc.stdin.close()
        except Exception:
            pass
        try:
            self.proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            try: self.proc.kill()
            except Exception: pass


def _flush_pending_clips_{{node_id}}():
    """Cleanly close every in-flight ffmpeg writer (called on exit/SIGTERM)."""
    for entry in list(_pending_clips_{{node_id}}):
        try: entry["writer"].release()
        except Exception: pass
        rec = entry.get("rec") or {}
        if rec.get("clip"):
            print(f"event {{node_id}}: clip flushed on exit -> {rec['clip']}")
    _pending_clips_{{node_id}}.clear()


_atexit_{{node_id}}.register(_flush_pending_clips_{{node_id}})
try:
    _signal_{{node_id}}.signal(_signal_{{node_id}}.SIGTERM, lambda *_: (_flush_pending_clips_{{node_id}}(), os._exit(0)))
except Exception:
    pass
try:
    _signal_{{node_id}}.signal(_signal_{{node_id}}.SIGINT, lambda *_: (_flush_pending_clips_{{node_id}}(), os._exit(0)))
except Exception:
    pass


def _flush_event_index_{{node_id}}(rec):
    with open(events_index_path_{{node_id}}, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")


# [loop]
upstream = state["{{input_id}}"]
# Annotated frame (with boxes/keypoints/labels) is what we want in the clip.
display_frame_{{node_id}} = upstream.get("annotated") if isinstance(upstream, dict) and upstream.get("annotated") is not None else upstream["frame"]
_now_loop_{{node_id}} = time.time()

# First-frame buffer sizing: resize to input FPS * clip_seconds so durations match real time.
if not _buffer_sized_{{node_id}} and isinstance(upstream, dict) and upstream.get("fps"):
    _effective_fps_{{node_id}} = max(1.0, float(upstream["fps"]))
    _cap = max(2, int(_effective_fps_{{node_id}} * CLIP_SECONDS_{{node_id}}))
    buffer_{{node_id}} = deque(buffer_{{node_id}}, maxlen=_cap)
    clip_meta_{{node_id}} = deque(clip_meta_{{node_id}}, maxlen=_cap)
    _pre_n_{{node_id}}  = _cap // 2
    _post_n_{{node_id}} = _cap - _pre_n_{{node_id}}
    _buffer_sized_{{node_id}} = True
    print(f"event {{node_id}}: clip buffer sized to {_cap} frames @ {_effective_fps_{{node_id}}:.1f}fps (pre={_pre_n_{{node_id}}}, post={_post_n_{{node_id}}})")

buffer_{{node_id}}.append(display_frame_{{node_id}})
clip_meta_{{node_id}}.append({"t": _now_loop_{{node_id}}, "detections": upstream.get("detections", [])})
_seen_e_{{node_id}} += 1

# Advance any in-progress post-event captures by feeding this annotated frame to ffmpeg.
_still_pending_{{node_id}} = []
for entry in _pending_clips_{{node_id}}:
    entry["writer"].write(display_frame_{{node_id}})
    entry["frames_meta"].append({"t": _now_loop_{{node_id}}, "detections": upstream.get("detections", [])})
    entry["remaining"] -= 1
    if entry["remaining"] > 0:
        _still_pending_{{node_id}}.append(entry)
    else:
        entry["writer"].release()
        rec = entry["rec"]
        if rec.get("clip_meta"):
            meta_doc = {
                "event_ts": rec["triggered_at"],
                "clip_path": rec["clip"],
                "clip_fps": _effective_fps_{{node_id}},
                "clip_seconds": CLIP_SECONDS_{{node_id}},
                "frame_count": len(entry["frames_meta"]),
                "frames": list(entry["frames_meta"]),
            }
            with open(rec["clip_meta"], "w", encoding="utf-8") as mfh:
                json.dump(meta_doc, mfh)
        print(f"event {{node_id}}: clip saved -> {rec['clip']}")
_pending_clips_{{node_id}} = _still_pending_{{node_id}}

# Trigger evaluation
if upstream["detections"]:
    now = _now_loop_{{node_id}}
    if now - _last_fire_{{node_id}} >= COOLDOWN_S_{{node_id}}:
        _last_fire_{{node_id}} = now
        _fired_{{node_id}} += 1
        ts_ms = int(now * 1000)
        event_record = {
            "node": "{{node_id}}",
            "pipeline": PIPELINE_NAME,
            "triggered_at": now,
            "detections": upstream["detections"],
            "screenshot": None,
            "clip": None,
            "clip_meta": None,
        }
        if SAVE_SCREENSHOT_{{node_id}}:
            shot_path = os.path.join(EVENTS_DIR_{{node_id}}, f"event_{ts_ms}.jpg")
            cv2.imwrite(shot_path, display_frame_{{node_id}})
            event_record["screenshot"] = shot_path

        if SAVE_CLIP_{{node_id}} and _FFMPEG_EXE_{{node_id}}:
            h, w = display_frame_{{node_id}}.shape[:2]
            clip_path = os.path.join(EVENTS_DIR_{{node_id}}, f"event_{ts_ms}.mp4")
            meta_path = os.path.join(EVENTS_DIR_{{node_id}}, f"event_{ts_ms}.json")
            try:
                writer = _FfmpegWriter_{{node_id}}(clip_path, _effective_fps_{{node_id}}, w, h)
                # Pre-event annotated frames (whatever the ring buffer has captured)
                _pre_slice_{{node_id}} = list(buffer_{{node_id}})[-_pre_n_{{node_id}}:]
                pre_meta_{{node_id}} = list(clip_meta_{{node_id}})[-_pre_n_{{node_id}}:]
                for f in _pre_slice_{{node_id}}:
                    writer.write(f)
                # Compensation: if pre-buffer didn't fill (event fired early), borrow
                # the missing frames from the post window so total duration matches.
                total_target = _pre_n_{{node_id}} + _post_n_{{node_id}}
                post_remaining = total_target - len(_pre_slice_{{node_id}})
                event_record["clip"] = clip_path
                event_record["clip_meta"] = meta_path
                _pending_clips_{{node_id}}.append({
                    "writer": writer,
                    "remaining": post_remaining,
                    "rec": event_record,
                    "frames_meta": pre_meta_{{node_id}},
                })
            except Exception as e:
                print(f"event {{node_id}}: failed to open ffmpeg writer: {e}")
        elif SAVE_CLIP_{{node_id}} and not _FFMPEG_EXE_{{node_id}}:
            print(f"event {{node_id}}: save_clip requested but ffmpeg unavailable")

        _flush_event_index_{{node_id}}(event_record)
        print(f"event {{node_id}}: fired -> {event_record.get('screenshot') or event_record.get('clip')}")
        state["{{node_id}}"] = event_record
    else:
        state["{{node_id}}"] = None
else:
    state["{{node_id}}"] = None

if time.time() - _last_hb_e_{{node_id}} >= 1.0:
    print(f"@HB {{node_id_raw}} frames={_seen_e_{{node_id}}} fired={_fired_{{node_id}}}", flush=True)
    _last_hb_e_{{node_id}} = time.time()
