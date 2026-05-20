import { Controller, Get } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const MODELS_DIR = path.resolve(__dirname, "..", "..", "models");

const VERSIONS = [
  { id: "yolov5",  label: "YOLOv5",  prefix: "yolov5"  },
  { id: "yolov6",  label: "YOLOv6",  prefix: "yolov6"  },
  { id: "yolov7",  label: "YOLOv7",  prefix: "yolov7"  },
  { id: "yolov8",  label: "YOLOv8",  prefix: "yolov8"  },
  { id: "yolov9",  label: "YOLOv9",  prefix: "yolov9"  },
  { id: "yolov10", label: "YOLOv10", prefix: "yolov10" },
  { id: "yolo11",  label: "YOLO11",  prefix: "yolo11"  },
  { id: "yolo12",  label: "YOLO12",  prefix: "yolo12"  },
  { id: "yolo26",  label: "YOLO26",  prefix: "yolo26"  },
];

const TASKS: { id: string; suffix: string; label: string }[] = [
  { id: "detect",   suffix: "",       label: "Detection" },
  { id: "segment",  suffix: "-seg",   label: "Instance Segmentation" },
  { id: "classify", suffix: "-cls",   label: "Classification" },
  { id: "pose",     suffix: "-pose",  label: "Pose Estimation" },
  { id: "obb",      suffix: "-obb",   label: "Oriented Bounding Box" },
];

const SIZES = ["n", "s", "m", "l", "x"];

function parseFilename(filename: string): { version: string; size: string; task: string } | null {
  if (!filename.endsWith(".pt")) return null;
  const base = filename.slice(0, -3);
  for (const v of VERSIONS) {
    if (!base.startsWith(v.prefix)) continue;
    const rest = base.slice(v.prefix.length);
    for (const t of TASKS) {
      for (const s of SIZES) {
        if (rest === `${s}${t.suffix}`) {
          return { version: v.id, size: s, task: t.id };
        }
      }
    }
  }
  return null;
}

@Controller("models")
export class ModelsController {
  /**
   * Returns only the YOLO weights that are actually present in backend/models/.
   * The frontend dropdowns are built directly from this — so users only see what they can run.
   */
  @Get()
  list() {
    if (!fs.existsSync(MODELS_DIR)) return { dir: MODELS_DIR, versions: [] };

    const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith(".pt"));
    type SizeEntry = { size: string; filename: string; available: boolean };
    type TaskEntry = { id: string; label: string; sizes: SizeEntry[] };
    type VersionEntry = { id: string; label: string; tasks: TaskEntry[] };

    const versionMap = new Map<string, VersionEntry>();
    for (const file of files) {
      const parsed = parseFilename(file);
      if (!parsed) continue;

      const vMeta = VERSIONS.find((v) => v.id === parsed.version)!;
      let version = versionMap.get(parsed.version);
      if (!version) {
        version = { id: vMeta.id, label: vMeta.label, tasks: [] };
        versionMap.set(parsed.version, version);
      }

      const tMeta = TASKS.find((t) => t.id === parsed.task)!;
      let task = version.tasks.find((t) => t.id === parsed.task);
      if (!task) {
        task = { id: tMeta.id, label: tMeta.label, sizes: [] };
        version.tasks.push(task);
      }
      if (!task.sizes.find((s) => s.size === parsed.size)) {
        task.sizes.push({ size: parsed.size, filename: file, available: true });
      }
    }

    // Stable ordering
    const versions = VERSIONS
      .map((v) => versionMap.get(v.id))
      .filter(Boolean) as VersionEntry[];
    for (const v of versions) {
      v.tasks.sort(
        (a, b) => TASKS.findIndex((t) => t.id === a.id) - TASKS.findIndex((t) => t.id === b.id),
      );
      for (const t of v.tasks) {
        t.sizes.sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
      }
    }

    return { dir: MODELS_DIR, versions };
  }
}
