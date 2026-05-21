import { Controller, Get } from "@nestjs/common";
import { CATALOG, DATASETS, COCO_POSE_KEYPOINTS, COCO_POSE_SKELETON } from "../../../shared/yolo-catalog";

/**
 * Read-only dump of the full model catalog + dataset metadata.
 * Lets the frontend show richer detail (params, FLOPs, mAP, dataset) without
 * forcing the existing /models endpoint to grow new fields.
 */
@Controller("models/catalog")
export class CatalogController {
  @Get()
  catalog() {
    return {
      families: CATALOG,
      datasets: DATASETS,
      coco_pose: {
        keypoints: COCO_POSE_KEYPOINTS,
        skeleton: COCO_POSE_SKELETON,
      },
    };
  }
}
