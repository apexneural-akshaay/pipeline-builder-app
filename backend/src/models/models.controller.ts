import { Controller, Get, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { CATALOG, CatalogTask, CatalogVariant } from "../../../shared/yolo-catalog";
import { DownloadsService } from "./downloads.service";

const MODELS_DIR = path.resolve(__dirname, "..", "..", "models");

/**
 * Response shape (kept compatible with the old controller — additive fields only):
 *
 *   { dir, versions: [
 *       { id, label, status, license, description, nms_free?,
 *         tasks: [
 *           { id, label, dataset,
 *             sizes: [
 *               { size, label, filename, available, downloadable,
 *                 input_size?, params_m?, flops_b?, map?, speed_cpu_ms?, speed_gpu_ms?, notes? }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * `available: true`        → file exists in backend/models/
 * `available: false`       → not on disk
 * `downloadable: true`     → Ultralytics will auto-fetch on first use
 *
 * Query params:
 *   ?installedOnly=true    → only return variants present on disk (old behavior)
 */
@Controller("models")
export class ModelsController {
  constructor(private readonly downloads: DownloadsService) {}

  @Get()
  list(@Query("installedOnly") installedOnly?: string) {
    const onlyInstalled = installedOnly === "true" || installedOnly === "1";

    const onDisk = new Set<string>();
    if (fs.existsSync(MODELS_DIR)) {
      for (const f of fs.readdirSync(MODELS_DIR)) {
        if (f.endsWith(".pt")) onDisk.add(f);
      }
    }

    const versions = CATALOG.map((fam) => {
      const tasks = fam.tasks.map((task: CatalogTask) => {
        const sizes = task.variants
          .map((v: CatalogVariant) => {
            const available = onDisk.has(v.filename);
            if (onlyInstalled && !available) return null;
            const job = this.downloads.get(v.filename);
            const dlStatus = available
              ? "installed"
              : job
                ? job.status
                : v.downloadable
                  ? "downloadable"
                  : "unavailable";
            return {
              size: v.size,
              label: v.label,
              filename: v.filename,
              available,
              downloadable: v.downloadable,
              download_status: dlStatus,
              download_error: job?.error,
              input_size: v.input_size,
              params_m: v.params_m,
              flops_b: v.flops_b,
              map: v.map,
              speed_cpu_ms: v.speed_cpu_ms,
              speed_gpu_ms: v.speed_gpu_ms,
              notes: v.notes,
            };
          })
          .filter(Boolean);
        return {
          id: task.id,
          label: task.label,
          dataset: task.dataset,
          sizes,
        };
      }).filter((t) => t.sizes.length > 0);

      return {
        id: fam.id,
        label: fam.label,
        status: fam.status,
        license: fam.license,
        description: fam.description,
        nms_free: fam.nms_free ?? false,
        tasks,
      };
    }).filter((v) => v.tasks.length > 0);

    return { dir: MODELS_DIR, versions };
  }
}
