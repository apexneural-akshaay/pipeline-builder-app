import { Controller, Get, Query, BadRequestException } from "@nestjs/common";

/** 80 COCO classes used by YOLO detect / segment / pose models. */
const COCO_CLASSES = [
  "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat","traffic light",
  "fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow",
  "elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee",
  "skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle",
  "wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange",
  "broccoli","carrot","hot dog","pizza","donut","cake","chair","couch","potted plant","bed",
  "dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone","microwave","oven",
  "toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush",
];

/** 15 DOTAv1 classes used by YOLO OBB models (aerial / satellite imagery). */
const DOTAV1_CLASSES = [
  "plane","ship","storage tank","baseball diamond","tennis court","basketball court",
  "ground track field","harbor","bridge","large vehicle","small vehicle",
  "helicopter","roundabout","soccer ball field","swimming pool",
];

/** Top-level groupings the frontend uses to render the picker. */
@Controller("models/classes")
export class ClassesController {
  /** GET /models/classes?task=detect → returns the class list YOLO would emit for that task. */
  @Get()
  list(@Query("task") task?: string) {
    const t = (task ?? "detect").toLowerCase();

    // Detect / segment / pose share COCO
    if (t === "detect" || t === "segment" || t === "pose") {
      return { task: t, source: "COCO", classes: COCO_CLASSES };
    }

    if (t === "obb") {
      return { task: t, source: "DOTAv1", classes: DOTAV1_CLASSES };
    }

    if (t === "classify") {
      // Classification uses 1000 ImageNet classes — too long for a dropdown.
      // The picker will fall back to a freeform text input for this task.
      return { task: t, source: "ImageNet-1k", classes: [] };
    }

    throw new BadRequestException(`Unknown task: ${task}`);
  }
}
