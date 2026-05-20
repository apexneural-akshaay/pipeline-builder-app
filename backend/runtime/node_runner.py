"""Single-block tester.

Invoked by the backend with: python node_runner.py <node_type> <config_json>
On stdin (optional): an "upstream" JSON for blocks that need it.

Returns JSON on stdout: { ok: bool, result?: {...}, error?: str }
"""
import sys
import json
import base64
import io
import os
import traceback


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "usage: node_runner.py <type> <config_json>"}))
        return

    node_type = sys.argv[1]
    config = json.loads(sys.argv[2])

    # Read optional upstream JSON from stdin (non-blocking — only if piped in)
    upstream = None
    if not sys.stdin.isatty():
        try:
            raw = sys.stdin.read()
            if raw.strip():
                upstream = json.loads(raw)
        except Exception:
            upstream = None

    try:
        if node_type == "video_input":
            result = run_video_input(config)
        elif node_type == "yolo_model":
            result = run_yolo_model(config, upstream)
        elif node_type == "condition":
            result = run_condition(config, upstream)
        elif node_type == "event_sink":
            result = run_event_sink(config, upstream)
        else:
            raise RuntimeError(f"Unknown node type: {node_type}")
        print(json.dumps({"ok": True, "result": result}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "traceback": traceback.format_exc()}))


def _frame_to_base64_jpg(frame, max_w=640):
    import cv2
    h, w = frame.shape[:2]
    if w > max_w:
        scale = max_w / w
        frame = cv2.resize(frame, (max_w, int(h * scale)))
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        return None
    return base64.b64encode(buf).decode("ascii")


def run_video_input(config):
    import cv2
    source = config.get("source") or ""
    if not source:
        raise RuntimeError("source is empty")
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open source: {source}")
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise RuntimeError("Source opened but produced no frame")
    h, w = frame.shape[:2]
    return {
        "width": w,
        "height": h,
        "native_fps": native_fps,
        "target_fps": float(config.get("fps", 5)),
        "frame_jpg_b64": _frame_to_base64_jpg(frame),
    }


def _resolve_weights(config):
    version = str(config.get("version", "yolo26")).lower()
    size = str(config.get("size", "n")).lower()
    task = str(config.get("task", "detect")).lower()
    suffix = {"detect": "", "segment": "-seg", "classify": "-cls", "pose": "-pose", "obb": "-obb"}.get(task, "")
    return f"{version}{size}{suffix}.pt"


def run_yolo_model(config, upstream):
    import cv2
    import numpy as np
    from ultralytics import YOLO

    # Get a test frame
    if upstream and upstream.get("frame_jpg_b64"):
        raw = base64.b64decode(upstream["frame_jpg_b64"])
        arr = np.frombuffer(raw, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    else:
        # Synthesize a blank frame so we can still verify the model loads
        frame = (np.ones((640, 640, 3), dtype="uint8") * 128)

    # Resolve weights — prefer the one in backend/models/ if it exists
    weights_name = _resolve_weights(config)
    backend_models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    local_path = os.path.join(backend_models_dir, weights_name)
    weights = local_path if os.path.exists(local_path) else weights_name

    model = YOLO(weights)
    task = str(config.get("task", "detect")).lower()
    tracking = bool(config.get("tracking", False))
    classes_filter = config.get("classes") or []
    conf = float(config.get("confidence", 0.25))

    if tracking and task in ("detect", "segment", "pose"):
        results = model.track(frame, conf=conf, persist=False, verbose=False)
    else:
        results = model(frame, conf=conf, verbose=False)

    detections = []
    annotated = None
    for r in results:
        annotated = r.plot()  # numpy array w/ boxes drawn
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            if hasattr(r, "probs") and r.probs is not None:
                top = int(r.probs.top1)
                cls_name = r.names[top]
                if not classes_filter or cls_name in classes_filter:
                    detections.append({
                        "class": cls_name,
                        "confidence": float(r.probs.top1conf),
                        "bbox": None,
                    })
            continue
        for b in boxes:
            cls_name = r.names[int(b.cls[0])]
            if classes_filter and cls_name not in classes_filter:
                continue
            detections.append({
                "class": cls_name,
                "confidence": float(b.conf[0]),
                "bbox": [float(x) for x in b.xyxy[0].tolist()],
            })

    return {
        "weights_used": weights_name,
        "weights_resolved_path": weights,
        "task": task,
        "tracking": tracking,
        "detections": detections,
        "detection_count": len(detections),
        "annotated_jpg_b64": _frame_to_base64_jpg(annotated) if annotated is not None else None,
    }


def run_condition(config, upstream):
    upstream_detections = (upstream or {}).get("detections", []) if upstream else []
    classes_filter = config.get("classes") or []
    min_conf = float(config.get("min_confidence", 0.5))
    passing = [
        d for d in upstream_detections
        if (not classes_filter or d.get("class") in classes_filter)
        and float(d.get("confidence", 0)) >= min_conf
    ]
    return {
        "input_count": len(upstream_detections),
        "passing_count": len(passing),
        "passing_detections": passing,
        "filter_classes": classes_filter,
        "min_confidence": min_conf,
    }


def run_event_sink(config, upstream):
    upstream_detections = (upstream or {}).get("detections", []) if upstream else []
    return {
        "would_fire": len(upstream_detections) > 0,
        "save_screenshot": bool(config.get("save_screenshot", False)),
        "save_clip": bool(config.get("save_clip", False)),
        "clip_seconds": int(config.get("clip_seconds", 10)),
        "cooldown_seconds": float(config.get("cooldown_seconds", 5)),
        "output_dir": config.get("output_dir", "./events"),
        "upstream_detection_count": len(upstream_detections),
    }


if __name__ == "__main__":
    main()
