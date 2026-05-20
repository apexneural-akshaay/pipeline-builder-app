# [imports]
import time as _time_cond_{{node_id}}

# [setup]
COND_CLASSES_{{node_id}} = {{classes}}            # list, empty = any class
COND_MIN_CONF_{{node_id}} = float("{{min_confidence}}")
_seen_{{node_id}} = 0
_passed_{{node_id}} = 0
_last_hb_c_{{node_id}} = _time_cond_{{node_id}}.time()

# [loop]
upstream = state["{{input_id}}"]
passing_{{node_id}} = [
    d for d in upstream["detections"]
    if (not COND_CLASSES_{{node_id}} or d["class"] in COND_CLASSES_{{node_id}})
    and d["confidence"] >= COND_MIN_CONF_{{node_id}}
]
state["{{node_id}}"] = {
    "frame": upstream["frame"],
    "annotated": upstream.get("annotated", upstream["frame"]),
    "detections": passing_{{node_id}},
    "task": upstream.get("task"),
    "fps": upstream.get("fps"),
    "width": upstream.get("width"),
    "height": upstream.get("height"),
}
_seen_{{node_id}} += 1
if passing_{{node_id}}:
    _passed_{{node_id}} += 1
if _time_cond_{{node_id}}.time() - _last_hb_c_{{node_id}} >= 1.0:
    print(f"@HB {{node_id_raw}} frames={_seen_{{node_id}}} passed={_passed_{{node_id}}}", flush=True)
    _last_hb_c_{{node_id}} = _time_cond_{{node_id}}.time()
