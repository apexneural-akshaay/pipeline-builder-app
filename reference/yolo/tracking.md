# Tracking

Tracking in Ultralytics is a **mode** on top of any detection / segmentation / pose model. Call `model.track(source=...)` and the framework wraps the detector with a tracker that assigns persistent integer `id`s across frames.

```python
from ultralytics import YOLO
m = YOLO("yolo11s.pt")
for r in m.track(source="video.mp4", tracker="botsort.yaml", stream=True):
    boxes = r.boxes      # has .id  populated
```

---

## Trackers available

| Tracker   | Config file       | Default? | Strength |
|-----------|-------------------|----------|----------|
| BoT-SORT  | `botsort.yaml`    | ✓ (default) | Combines motion (Kalman) + appearance (optional ReID) + global motion compensation (GMC). Best general-purpose. |
| ByteTrack | `bytetrack.yaml`  |          | Lightweight; associates with both high- and low-confidence detections. Lower CPU cost. No ReID, no GMC. |

Pass the tracker as `tracker="botsort.yaml"` or `tracker="bytetrack.yaml"`. You can also pass a custom YAML path.

---

## Key configuration parameters

These live in the tracker YAML. All thresholds are 0.0–1.0.

| Param                | Default (BoT-SORT)         | Meaning |
|----------------------|----------------------------|---------|
| `tracker_type`       | `botsort` / `bytetrack`    | Selects the algorithm. |
| `track_high_thresh`  | 0.25                       | First-pass detection-to-track matching threshold. |
| `track_low_thresh`   | 0.1                        | Second-pass association for low-confidence detections (ByteTrack idea). |
| `new_track_thresh`   | 0.25                       | Confidence required to spawn a new track. |
| `track_buffer`       | 30 (frames)                | How many frames to remember a lost track before deleting it. |
| `match_thresh`       | 0.8                        | IoU/distance threshold used during the Hungarian matching step. |
| `fuse_score`         | True                       | Mix detection confidence into the cost matrix. |
| `gmc_method`         | `sparseOptFlow` (BoT-SORT) | Global motion compensation: `orb`, `sift`, `ecc`, `sparseOptFlow`, or `None`. ByteTrack ignores this. |
| `proximity_thresh`   | 0.5 (BoT-SORT)             | IoU threshold for the appearance-fused gating. |
| `appearance_thresh`  | 0.25 (BoT-SORT)            | ReID-embedding cosine-similarity threshold. |
| `with_reid`          | False                      | Enable appearance-based ReID. When True, an embedding model is used in addition to motion. |
| `model`              | `auto`                     | ReID feature model. `auto` reuses the detector's internal features when possible. |

---

## ReID (Re-Identification)

Off by default (`with_reid: False`) because it costs extra inference time. Turn it on for:
- Crowded scenes with frequent occlusion.
- Long camera handoffs / re-entry.
- When motion alone fails (e.g. similar trajectories).

When enabled, BoT-SORT uses either:
- Native features extracted from the detector backbone (fast, lower quality), or
- An explicit classification model supplied via the `model` field (slower, higher quality).

---

## Behavior knobs at call time (predict/track args)

These are passed when calling `.track()`:

| Arg              | Default | Meaning |
|------------------|---------|---------|
| `persist`        | False   | Keep tracker state across separate `.track()` calls — required when feeding frames one at a time. |
| `tracker`        | `"botsort.yaml"` | Path to tracker YAML. |
| `vid_stride`     | 1       | Process every Nth frame. |
| `stream_buffer`  | False   | Buffer vs. drop frames when input source is faster than inference. |
| `classes`        | None    | Restrict tracking to a subset of class IDs. |

---

## Which models can track?

Any family that publishes detection / segmentation / pose weights — the tracker is model-agnostic. SAM and SAM 2 do **not** integrate with `model.track()` (different output type); for video segmentation, SAM 2 has its own per-frame propagation mechanism.

## Sources
- https://docs.ultralytics.com/modes/track/
- https://github.com/NirAharon/BoT-SORT
- https://github.com/ifzhang/ByteTrack
