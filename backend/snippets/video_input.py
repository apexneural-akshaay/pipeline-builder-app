# [imports]
import time
import cv2

# [setup]
# Source can be an RTSP URL or a local video file — cv2.VideoCapture handles both.
cap_{{node_id}} = cv2.VideoCapture("{{source}}")
if not cap_{{node_id}}.isOpened():
    raise RuntimeError("Failed to open source: {{source}}")

# Detect native FPS so we can downsample if the user picked a lower processing FPS.
NATIVE_FPS_{{node_id}} = cap_{{node_id}}.get(cv2.CAP_PROP_FPS) or 30.0
TARGET_FPS_{{node_id}} = float("{{fps}}")
FRAME_STRIDE_{{node_id}} = max(1, int(round(NATIVE_FPS_{{node_id}} / TARGET_FPS_{{node_id}})))
print(f"video_input {{node_id}}: native={NATIVE_FPS_{{node_id}}:.1f}fps target={TARGET_FPS_{{node_id}}}fps stride={FRAME_STRIDE_{{node_id}}}")

# Read first frame so downstream blocks know the resolution before the loop.
ok_first_{{node_id}}, first_{{node_id}} = cap_{{node_id}}.read()
if not ok_first_{{node_id}}:
    raise RuntimeError("Source opened but produced no frames: {{source}}")
SRC_H_{{node_id}}, SRC_W_{{node_id}} = first_{{node_id}}.shape[:2]
print(f"video_input {{node_id}}: resolution {SRC_W_{{node_id}}}x{SRC_H_{{node_id}}}")
# Expose source path + 0-based position into the source video, so downstream
# event_sink can ffmpeg-clip a window directly out of the original file.
SRC_PATH_{{node_id}} = "{{source}}"
SRC_IS_FILE_{{node_id}} = not SRC_PATH_{{node_id}}.lower().startswith(("rtsp://", "http://", "https://"))
state["{{node_id}}"] = {
    "frame": first_{{node_id}},
    "width": SRC_W_{{node_id}},
    "height": SRC_H_{{node_id}},
    "fps": TARGET_FPS_{{node_id}},
    "source": SRC_PATH_{{node_id}},
    "source_is_file": SRC_IS_FILE_{{node_id}},
    "video_time": 0.0,
    "native_fps": NATIVE_FPS_{{node_id}},
}
_frame_idx_{{node_id}} = 0
_emitted_{{node_id}} = 0
_last_hb_{{node_id}} = time.time()

# [loop]
_frame_idx_{{node_id}} += 1
ok_{{node_id}}, frame_{{node_id}} = cap_{{node_id}}.read()
if not ok_{{node_id}}:
    # End of file or stream — break for files, retry briefly for streams
    if "{{source}}".startswith("rtsp://"):
        time.sleep(0.5)
        continue
    break
# FPS gate — only forward 1 in every FRAME_STRIDE frames
if _frame_idx_{{node_id}} % FRAME_STRIDE_{{node_id}} != 0:
    continue
# Current position in the source video, in seconds — used by event_sink to cut a clip.
_video_time_{{node_id}} = _frame_idx_{{node_id}} / max(1.0, NATIVE_FPS_{{node_id}})
state["{{node_id}}"] = {
    "frame": frame_{{node_id}},
    "width": SRC_W_{{node_id}},
    "height": SRC_H_{{node_id}},
    "fps": TARGET_FPS_{{node_id}},
    "source": SRC_PATH_{{node_id}},
    "source_is_file": SRC_IS_FILE_{{node_id}},
    "video_time": _video_time_{{node_id}},
    "native_fps": NATIVE_FPS_{{node_id}},
}
_emitted_{{node_id}} += 1
if time.time() - _last_hb_{{node_id}} >= 1.0:
    print(f"@HB {{node_id_raw}} frames={_emitted_{{node_id}}}", flush=True)
    _last_hb_{{node_id}} = time.time()
