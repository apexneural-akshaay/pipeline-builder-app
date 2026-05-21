import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import {
  DatasetInfo,
  datasetForFilename,
  defaultDatasetForTask,
  findVariant,
} from "../../../shared/yolo-catalog";

/**
 * GET /models/classes — returns the class list a YOLO model emits.
 *
 * Resolution order:
 *   1. ?filename=yolov8s-obb.pt        → look up that exact variant in the catalog,
 *                                        return its training dataset.
 *   2. ?family=yolo11&task=detect&size=n → look up the (family, task, size) variant.
 *   3. ?task=detect                    → fall back to the default dataset for that task.
 *
 * Response:
 *   { task, source, class_count, classes, is_freeform? }
 *
 * `is_freeform: true` means the class list is too long to enumerate (e.g.
 * ImageNet-1k) — the picker should switch to a text input.
 */
@Controller("models/classes")
export class ClassesController {
  @Get()
  list(
    @Query("task") task?: string,
    @Query("family") family?: string,
    @Query("size") size?: string,
    @Query("filename") filename?: string,
  ) {
    if (filename) {
      const ds = datasetForFilename(filename);
      if (!ds) {
        throw new BadRequestException(`Unknown filename: ${filename}`);
      }
      return shape(task ?? "?", ds);
    }

    if (family && task && size) {
      const v = findVariant(family, task, size);
      if (!v) {
        throw new BadRequestException(
          `No catalog variant for family=${family} task=${task} size=${size}`,
        );
      }
      // Find the dataset by walking back into the catalog.
      const ds = datasetForFilename(v.filename);
      if (!ds) {
        throw new BadRequestException(
          `Variant ${v.filename} has no associated dataset`,
        );
      }
      return shape(task, ds);
    }

    const t = (task ?? "detect").toLowerCase();
    const ds = defaultDatasetForTask(t);
    if (!ds) {
      throw new BadRequestException(`Unknown task: ${task}`);
    }
    return shape(t, ds);
  }
}

function shape(task: string, ds: DatasetInfo) {
  return {
    task,
    source: ds.id,
    label: ds.label,
    class_count: ds.class_count,
    classes: ds.classes,
    is_freeform: ds.is_freeform ?? false,
  };
}
