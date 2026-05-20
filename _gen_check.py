# AUTO-GENERATED — do not edit by hand
# Pipeline: syntax_check

from collections import deque
from ultralytics import YOLO
import cv2
import os
import requests
import time

PIPELINE_NAME = "syntax_check"
state = {}

# ─── setup ─────────────────────────────────────────
# ── rtsp_source (_rtsp_source) ──
cap = cv2.VideoCapture("rtsp://x")
if not cap.isOpened():
    raise RuntimeError("Failed to open RTSP stream: rtsp://x")

# ── yolo_detect (a) ──
model_a = YOLO("y.pt")

# ── class_filter (b) ──
classes_b = ["person"]

# ── save_clip (c) ──
os.makedirs("./c", exist_ok=True)
CLIP_FPS_c = 15
buffer_c = deque(maxlen=CLIP_FPS_c * 10)

# ── save_screenshot (d) ──
os.makedirs("./s", exist_ok=True)


# ─── main loop ─────────────────────────────────────
while True:
    # ── rtsp_source (_rtsp_source) ──
    ok, frame = cap.read()
    if not ok:
        continue
    state["_rtsp_source"] = frame
    # ── yolo_detect (a) ──
    frame_in = state["_rtsp_source"]
    results_a = model_a(frame_in, conf=0.5, verbose=False)
    dets_a = []
    for r in results_a:
        for b in r.boxes:
            dets_a.append({
                "class": r.names[int(b.cls[0])],
                "confidence": float(b.conf[0]),
                "bbox": b.xyxy[0].tolist(),
            })
    state["a"] = {"frame": frame_in, "detections": dets_a}
    # ── class_filter (b) ──
    upstream = state["a"]
    filtered_b = [d for d in upstream["detections"] if d["class"] in classes_b]
    state["b"] = {"frame": upstream["frame"], "detections": filtered_b}
    # ── save_clip (c) ──
    upstream = state["b"]
    buffer_c.append(upstream["frame"])
    if upstream["detections"]:
        h, w = upstream["frame"].shape[:2]
        ts = int(time.time() * 1000)
        path = os.path.join("./c", f"clip_{ts}.mp4")
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(path, fourcc, CLIP_FPS_c, (w, h))
        for f in list(buffer_c):
            writer.write(f)
        writer.release()
        state["c"] = path
    else:
        state["c"] = None
    # ── save_screenshot (d) ──
    upstream = state["b"]
    if upstream["detections"]:
        ts = int(time.time() * 1000)
        path = os.path.join("./s", f"event_{ts}.jpg")
        cv2.imwrite(path, upstream["frame"])
        state["d"] = path
    else:
        state["d"] = None
    # ── webhook (e) ──
    upstream = state["b"]
    if upstream["detections"]:
        try:
            requests.post(
                "http://hook",
                json={
                    "pipeline": PIPELINE_NAME,
                    "node": "e",
                    "triggered_at": time.time(),
                    "detections": upstream["detections"],
                },
                timeout=5,
            )
        except Exception as e:
            print(f"webhook e failed: {e}")
    state["e"] = upstream
