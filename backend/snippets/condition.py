# [imports]
import json as _json_cond_{{node_id}}
import time as _time_cond_{{node_id}}

# [setup]
# Rule-based gating. RULES_JSON is a JSON string holding:
#   { "combinator": "AND" | "OR",
#     "rules": [ {type, ...}, ... ] }
#
# Rule types:
#   {"type": "count",          "class": "person" or "*", "op": ">|>=|<|<=|=", "value": N}
#   {"type": "any_class",      "classes": ["person", "car"]}
#   {"type": "all_classes",    "classes": ["person", "car"]}
#   {"type": "min_confidence", "value": 0.8}
#   {"type": "max_count",      "class": "person" or "*", "value": N}
#
# An empty rules list passes everything (legacy behavior).

try:
    COND_SPEC_{{node_id}} = _json_cond_{{node_id}}.loads("""{{rules}}""")
    if not isinstance(COND_SPEC_{{node_id}}, dict):
        COND_SPEC_{{node_id}} = {"combinator": "AND", "rules": []}
except Exception as _e_cond_{{node_id}}:
    print(f"condition {{node_id}}: invalid rules JSON ({_e_cond_{{node_id}}}); allowing all")
    COND_SPEC_{{node_id}} = {"combinator": "AND", "rules": []}

COND_COMB_{{node_id}}  = (COND_SPEC_{{node_id}}.get("combinator") or "AND").upper()
COND_RULES_{{node_id}} = COND_SPEC_{{node_id}}.get("rules") or []

_seen_{{node_id}} = 0
_passed_{{node_id}} = 0
_last_hb_c_{{node_id}} = _time_cond_{{node_id}}.time()


def _eval_rule_{{node_id}}(rule, detections):
    """Return True if this single rule passes against the current detection list."""
    rtype = rule.get("type")

    if rtype == "count":
        cls = rule.get("class") or "*"
        op  = rule.get("op") or ">"
        val = float(rule.get("value", 0))
        if cls == "*" or not cls:
            n = len(detections)
        else:
            n = sum(1 for d in detections if d.get("class") == cls)
        if op == ">":  return n >  val
        if op == ">=": return n >= val
        if op == "<":  return n <  val
        if op == "<=": return n <= val
        if op in ("=", "=="): return n == val
        return False

    if rtype == "any_class":
        wanted = set(rule.get("classes") or [])
        if not wanted: return False
        return any(d.get("class") in wanted for d in detections)

    if rtype == "all_classes":
        wanted = set(rule.get("classes") or [])
        if not wanted: return False
        present = set(d.get("class") for d in detections)
        return wanted.issubset(present)

    if rtype == "min_confidence":
        thr = float(rule.get("value", 0))
        return any(float(d.get("confidence") or 0) >= thr for d in detections)

    if rtype == "max_count":
        cls = rule.get("class") or "*"
        val = float(rule.get("value", 0))
        if cls == "*" or not cls:
            n = len(detections)
        else:
            n = sum(1 for d in detections if d.get("class") == cls)
        return n <= val

    # Unknown rule type — fail closed (don't pass).
    print(f"condition {{node_id}}: unknown rule type {rtype!r}, treating as False")
    return False


def _eval_rules_{{node_id}}(detections):
    """Evaluate all rules and combine with AND/OR. Empty list = pass everything."""
    if not COND_RULES_{{node_id}}:
        return True
    results = [_eval_rule_{{node_id}}(r, detections) for r in COND_RULES_{{node_id}}]
    if COND_COMB_{{node_id}} == "OR":
        return any(results)
    return all(results)


print(f"condition {{node_id}}: {len(COND_RULES_{{node_id}})} rule(s), combinator={COND_COMB_{{node_id}}}")

# [loop]
upstream = state["{{input_id}}"]
_dets_{{node_id}} = upstream.get("detections") or []
_pass_{{node_id}} = _eval_rules_{{node_id}}(_dets_{{node_id}})

# Pass detections downstream only when the rules say so. Empty list = no event.
state["{{node_id}}"] = {
    "frame": upstream["frame"],
    "annotated": upstream.get("annotated", upstream["frame"]),
    "detections": _dets_{{node_id}} if _pass_{{node_id}} else [],
    "task": upstream.get("task"),
    "fps": upstream.get("fps"),
    "width": upstream.get("width"),
    "height": upstream.get("height"),
    "source": upstream.get("source"),
    "source_is_file": upstream.get("source_is_file", False),
    "video_time": upstream.get("video_time", 0.0),
    "native_fps": upstream.get("native_fps", 0.0),
}
_seen_{{node_id}} += 1
if _pass_{{node_id}}:
    _passed_{{node_id}} += 1
if _time_cond_{{node_id}}.time() - _last_hb_c_{{node_id}} >= 1.0:
    print(f"@HB {{node_id_raw}} frames={_seen_{{node_id}}} passed={_passed_{{node_id}}}", flush=True)
    _last_hb_c_{{node_id}} = _time_cond_{{node_id}}.time()
