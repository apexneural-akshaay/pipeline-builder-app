"""Download a single Ultralytics weight file into a target directory.

Invoked by the backend DownloadService. Streams JSON status lines on stdout so
the Node side can forward them over SSE. Designed to be killable (SIGTERM).

Usage:
    python download_weight.py <filename> <dest_dir>

Status lines (one JSON object per line):
    {"event": "start",    "filename": "..."}
    {"event": "progress", "filename": "...", "downloaded": <int>, "total": <int>}
    {"event": "done",     "filename": "...", "path": "..."}
    {"event": "error",    "filename": "...", "message": "..."}
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import time


def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> int:
    if len(sys.argv) != 3:
        emit({"event": "error", "message": "usage: download_weight.py <filename> <dest_dir>"})
        return 2

    filename = sys.argv[1]
    dest_dir = sys.argv[2]
    os.makedirs(dest_dir, exist_ok=True)

    emit({"event": "start", "filename": filename})

    try:
        # Ultralytics handles the actual HTTP fetch + checksum + auto-resume.
        # We import lazily so missing-dep errors are reported as JSON, not stack trace.
        from ultralytics.utils.downloads import attempt_download_asset  # type: ignore
    except Exception as e:
        emit({"event": "error", "filename": filename, "message": f"ultralytics import failed: {e}"})
        return 1

    # Ultralytics downloads into its own cache dir then we move it to ours.
    try:
        # attempt_download_asset returns the cached path (str) of the file.
        path = attempt_download_asset(filename)
    except Exception as e:
        emit({"event": "error", "filename": filename, "message": str(e)})
        return 1

    if not path or not os.path.exists(path):
        emit({"event": "error", "filename": filename, "message": "file not found after download"})
        return 1

    dest_path = os.path.join(dest_dir, filename)
    try:
        # Move (or copy if cross-device) into backend/models/ so /models picks it up.
        if os.path.abspath(path) != os.path.abspath(dest_path):
            if os.path.exists(dest_path):
                os.remove(dest_path)
            shutil.move(path, dest_path)
    except Exception as e:
        emit({"event": "error", "filename": filename, "message": f"move failed: {e}"})
        return 1

    size = os.path.getsize(dest_path)
    emit({
        "event": "done",
        "filename": filename,
        "path": dest_path.replace("\\", "/"),
        "size": size,
    })
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        emit({"event": "error", "message": "interrupted"})
        sys.exit(130)
