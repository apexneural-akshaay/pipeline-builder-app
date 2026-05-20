"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelsController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MODELS_DIR = path.resolve(__dirname, "..", "..", "models");
const VERSIONS = [
    { id: "yolov5", label: "YOLOv5", prefix: "yolov5" },
    { id: "yolov6", label: "YOLOv6", prefix: "yolov6" },
    { id: "yolov7", label: "YOLOv7", prefix: "yolov7" },
    { id: "yolov8", label: "YOLOv8", prefix: "yolov8" },
    { id: "yolov9", label: "YOLOv9", prefix: "yolov9" },
    { id: "yolov10", label: "YOLOv10", prefix: "yolov10" },
    { id: "yolo11", label: "YOLO11", prefix: "yolo11" },
    { id: "yolo12", label: "YOLO12", prefix: "yolo12" },
    { id: "yolo26", label: "YOLO26", prefix: "yolo26" },
];
const TASKS = [
    { id: "detect", suffix: "", label: "Detection" },
    { id: "segment", suffix: "-seg", label: "Instance Segmentation" },
    { id: "classify", suffix: "-cls", label: "Classification" },
    { id: "pose", suffix: "-pose", label: "Pose Estimation" },
    { id: "obb", suffix: "-obb", label: "Oriented Bounding Box" },
];
const SIZES = ["n", "s", "m", "l", "x"];
function parseFilename(filename) {
    if (!filename.endsWith(".pt"))
        return null;
    const base = filename.slice(0, -3);
    for (const v of VERSIONS) {
        if (!base.startsWith(v.prefix))
            continue;
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
let ModelsController = class ModelsController {
    /**
     * Returns only the YOLO weights that are actually present in backend/models/.
     * The frontend dropdowns are built directly from this — so users only see what they can run.
     */
    list() {
        if (!fs.existsSync(MODELS_DIR))
            return { dir: MODELS_DIR, versions: [] };
        const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith(".pt"));
        const versionMap = new Map();
        for (const file of files) {
            const parsed = parseFilename(file);
            if (!parsed)
                continue;
            const vMeta = VERSIONS.find((v) => v.id === parsed.version);
            let version = versionMap.get(parsed.version);
            if (!version) {
                version = { id: vMeta.id, label: vMeta.label, tasks: [] };
                versionMap.set(parsed.version, version);
            }
            const tMeta = TASKS.find((t) => t.id === parsed.task);
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
            .filter(Boolean);
        for (const v of versions) {
            v.tasks.sort((a, b) => TASKS.findIndex((t) => t.id === a.id) - TASKS.findIndex((t) => t.id === b.id));
            for (const t of v.tasks) {
                t.sizes.sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
            }
        }
        return { dir: MODELS_DIR, versions };
    }
};
exports.ModelsController = ModelsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "list", null);
exports.ModelsController = ModelsController = __decorate([
    (0, common_1.Controller)("models")
], ModelsController);
