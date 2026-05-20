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

# Resolve ffmpeg binary for clip transcoding (so the browser can play the saved MP4).
try:
    import imageio_ffmpeg as _iio_ff_{{node_id}}
    _FFMPEG_EXE_{{node_id}} = _iio_ff_{{node_id}}.get_ffmpeg_exe()
except Exception:
    _FFMPEG_EXE_{{node_id}} = shutil.which("ffmpeg") or None

EVENTS_DIR_{{node_id}} = "{{output_dir}}"
SAVE_SCREENSHOT_{{node_id}} = {{save_screenshot}}    # "True" / "False" injected by assembler
SAVE_CLIP_{{node_id}}       = {{save_clip}}
CLIP_SECONDS_{{node_id}}    = int("{{clip_seconds}}")
CLIP_FPS_HINT_{{node_id}}   = int("{{clip_fps}}")           # advisory; we use the input FPS at runtime
COOLDOWN_S_{{node_id}}      = float("{{cooldown_seconds}}")

os.makedirs(EVENTS_DIR_{{node_id}}, exist_ok=True)
events_index_path_{{node_id}} = os.path.join(EVENTS_DIR_{{node_id}}, "events.jsonl")

# Buffers — sized from the input FPS once we see the first frame. These are reallocated
# the first time we get an upstream with a "fps" field so the clip duration matches real time.
_BUFFER_CAPACITY_{{node_id}} = max(1, CLIP_FPS_HINT_{{node_id}} * CLIP_SECONDS_{{node_id}})
buffer_{{node_id}} = deque(maxlen=_BUFFER_CAPACITY_{{node_id}})
clip_meta_{{node_id}} = deque(maxlen=_BUFFER_CAPACITY_{{node_id}})
_pre_n_{{node_id}}  = _BUFFER_CAPACITY_{{node_id}} // 2
_post_n_{{node_id}} = _BUFFER_CAPACITY_{{node_id}} - _pre_n_{{node_id}}
_buffer_sized_{{node_id}} = False
_effective_fps_{{node_id}} = float(CLIP_FPS_HINT_{{node_id}})

# Active post-event captures. Each entry: (writer, remaining_frames, event_record, frames_meta)
_pending_clips_{{node_id}} = []

_last_fire_{{node_id}} = 0.0
_seen_e_{{node_id}} = 0
_fired_{{node_id}} = 0
_last_hb_e_{{node_id}} = time.time()


def _flush_pending_clips_{{node_id}}():
    """Release every pending VideoWriter, spawn transcodes, wait for them on exit."""
    for entry in list(_pending_clips_{{node_id}}):
        writer, _remaining, rec, _frames_meta = entry
        try: writer.release()
        except Exception: pass
        try:
            if rec.get("clip"):
                _transcode_to_h264_{{node_id}}(rec["clip"])
                print(f"event {{node_id}}: clip flushed on exit -> {rec['clip']}")
        except Exception as e:
            print(f"event {{node_id}}: flush failed: {e}")
    _pending_clips_{{node_id}}.clear()
    _wait_for_transcodes_{{node_id}}(timeout_s=20.0)
    _reap_transcodes_{{node_id}}()

_atexit_{{node_id}}.register(_flush_pending_clips_{{node_id}})
try:
    _signal_{{node_id}}.signal(_signal_{{node_id}}.SIGTERM, lambda *_: (_flush_pending_clips_{{node_id}}(), os._exit(0)))
except Exception:
    pass  # SIGTERM may not be settable on Windows
try:
    _signal_{{node_id}}.signal(_signal_{{node_id}}.SIGINT, lambda *_: (_flush_pending_clips_{{node_id}}(), os._exit(0)))
except Exception:
    pass


def _try_h264_writer_{{node_id}}(path, fps, w, h):
    """OpenCV builds on Windows can't reliably write H.264 directly. We write with
    mp4v (always works) then transcode to H.264 after release so the browser plays it."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    wr = cv2.VideoWriter(path, fourcc, fps, (w, h))
    if not wr.isOpened():
        raise RuntimeError(f"VideoWriter could not open {path}")
    return wr


_pending_transcodes_{{node_id}} = []  # list of (popen, tmp_path, final_path)


def _reap_transcodes_{{node_id}}():
    """Poll any in-flight transcode subprocesses; replace original mp4 when done."""
    still = []
    for popen, tmp, final in _pending_transcodes_{{node_id}}:
        rc = popen.poll()
        if rc is None:
            still.append((popen, tmp, final))
            continue
        if rc == 0 and os.path.exists(tmp):
            try:
                os.replace(tmp, final)
                print(f"event {{node_id}}: transcoded -> {final}")
            except Exception as e:
                print(f"event {{node_id}}: transcode replace failed: {e}")
        else:
            if os.path.exists(tmp):
                try: os.remove(tmp)
                except Exception: pass
            print(f"event {{node_id}}: transcode rc={rc} (keeping mp4v fallback)")
    _pending_transcodes_{{node_id}}[:] = still


def _transcode_to_h264_{{node_id}}(path):
    """Spawn an H.264 transcode in the background so the inference loop isn't blocked.
    Browser playback uses the H.264 version once the transcode completes."""
    if not _FFMPEG_EXE_{{node_id}}:
        return
    tmp = path + ".tmp.mp4"
    try:
        popen = subprocess.Popen(
            [_FFMPEG_EXE_{{node_id}}, "-y", "-i", path, "-c:v", "libx264", "-preset", "ultrafast",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", tmp],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        _pending_transcodes_{{node_id}}.append((popen, tmp, path))
    except Exception as e:
        print(f"event {{node_id}}: transcode spawn failed ({e})")


def _wait_for_transcodes_{{node_id}}(timeout_s=30.0):
    """Block until all in-flight transcodes finish or the timeout elapses (exit-time helper)."""
    import time as _t
    deadline = _t.time() + timeout_s
    while _pending_transcodes_{{node_id}} and _t.time() < deadline:
        _reap_transcodes_{{node_id}}()
        _t.sleep(0.2)


def _flush_event_index_{{node_id}}(rec):
    with open(events_index_path_{{node_id}}, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")


# [loop]
upstream = state["{{input_id}}"]
# Annotated frame (with bounding boxes) when available
display_frame_{{node_id}} = upstream.get("annotated") if isinstance(upstream, dict) and upstream.get("annotated") is not None else upstream["frame"]
_now_loop_{{node_id}} = time.time()

# First-frame buffer sizing: resize to input FPS * clip_seconds so a 10s clip is really 10s.
if not _buffer_sized_{{node_id}} and isinstance(upstream, dict) and upstream.get("fps"):
    _effective_fps_{{node_id}} = max(1.0, float(upstream["fps"]))
    _cap = int(_effective_fps_{{node_id}} * CLIP_SECONDS_{{node_id}})
    _cap = max(2, _cap)
    buffer_{{node_id}} = deque(buffer_{{node_id}}, maxlen=_cap)
    clip_meta_{{node_id}} = deque(clip_meta_{{node_id}}, maxlen=_cap)
    _pre_n_{{node_id}}  = _cap // 2
    _post_n_{{node_id}} = _cap - _pre_n_{{node_id}}
    _buffer_sized_{{node_id}} = True
    print(f"event {{node_id}}: clip buffer sized to {_cap} frames @ {_effective_fps_{{node_id}}:.1f}fps (pre={_pre_n_{{node_id}}}, post={_post_n_{{node_id}}})")

buffer_{{node_id}}.append(display_frame_{{node_id}})
clip_meta_{{node_id}}.append({"t": _now_loop_{{node_id}}, "detections": upstream.get("detections", [])})
_seen_e_{{node_id}} += 1

# Advance any in-progress post-event captures by appending this frame.
_still_pending_{{node_id}} = []
for entry in _pending_clips_{{node_id}}:
    writer, remaining, rec, frames_meta = entry
    writer.write(display_frame_{{node_id}})
    frames_meta.append({"t": _now_loop_{{node_id}}, "detections": upstream.get("detections", [])})
    remaining -= 1
    if remaining > 0:
        _still_pending_{{node_id}}.append((writer, remaining, rec, frames_meta))
    else:
        writer.release()
        # Re-encode to H.264 so HTML5 <video> can play it natively
        _transcode_to_h264_{{node_id}}(rec["clip"])
        # Update the sidecar with the full pre+post frame list
        if rec.get("clip_meta"):
            meta_doc = {
                "event_ts": rec["triggered_at"],
                "clip_path": rec["clip"],
                "clip_fps": _effective_fps_{{node_id}},
                "clip_seconds": CLIP_SECONDS_{{node_id}},
                "frame_count": len(frames_meta),
                "frames": list(frames_meta),
            }
            with open(rec["clip_meta"], "w", encoding="utf-8") as mfh:
                json.dump(meta_doc, mfh)
        print(f"event {{node_id}}: clip finalized -> {rec['clip']}")
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
        if SAVE_CLIP_{{node_id}}:
            h, w = display_frame_{{node_id}}.shape[:2]
            clip_path = os.path.join(EVENTS_DIR_{{node_id}}, f"event_{ts_ms}.mp4")
            meta_path = os.path.join(EVENTS_DIR_{{node_id}}, f"event_{ts_ms}.json")
            writer = _try_h264_writer_{{node_id}}(clip_path, _effective_fps_{{node_id}}, w, h)
            # Write only the last _pre_n frames so total clip length = clip_seconds.
            _pre_slice_{{node_id}} = list(buffer_{{node_id}})[-_pre_n_{{node_id}}:]
            pre_meta_{{node_id}} = list(clip_meta_{{node_id}})[-_pre_n_{{node_id}}:]
            for f in _pre_slice_{{node_id}}:
                writer.write(f)
            event_record["clip"] = clip_path
            event_record["clip_meta"] = meta_path
            # Schedule post-event frames to be written as the loop continues
            _pending_clips_{{node_id}}.append((writer, _post_n_{{node_id}}, event_record, pre_meta_{{node_id}}))
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
    _reap_transcodes_{{node_id}}()  # poll completed background transcodes
