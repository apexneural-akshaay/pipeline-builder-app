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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/* Reads events written by the generated pipeline runtime into ./events/events.jsonl.
   For the demo we serve from the backend folder, but in a real deploy each pipeline
   writes to its own folder and the backend would scan all of them. */
const EVENTS_DIR = path.resolve(__dirname, "..", "..", "events");
/** On import, reap any stranded ffmpeg transcode tmp files left by a previous run.
 *  Also drops 0-byte / very small (truncated) MP4s that would fail to play. */
function reapTranscodeTmps() {
    if (!fs.existsSync(EVENTS_DIR))
        return;
    for (const f of fs.readdirSync(EVENTS_DIR)) {
        const full = path.join(EVENTS_DIR, f);
        if (f.endsWith(".mp4.tmp.mp4")) {
            const final = path.join(EVENTS_DIR, f.replace(".mp4.tmp.mp4", ".mp4"));
            try {
                if (fs.existsSync(final))
                    fs.renameSync(full, final);
            }
            catch { }
            continue;
        }
        // Tiny / truncated MP4s left over from a hard-killed pipeline — these have no
        // moov atom and break the events page video element. Drop them.
        if (f.endsWith(".mp4")) {
            try {
                const st = fs.statSync(full);
                if (st.size < 1024)
                    fs.unlinkSync(full);
            }
            catch { }
        }
    }
}
reapTranscodeTmps();
let EventsController = class EventsController {
    list() {
        reapTranscodeTmps();
        if (!fs.existsSync(EVENTS_DIR))
            return { events: [] };
        const indexPath = path.join(EVENTS_DIR, "events.jsonl");
        if (!fs.existsSync(indexPath))
            return { events: [] };
        const lines = fs.readFileSync(indexPath, "utf8").split("\n").filter(Boolean);
        const events = lines
            .map((l) => {
            try {
                return JSON.parse(l);
            }
            catch {
                return null;
            }
        })
            .filter(Boolean)
            .reverse(); // newest first
        return { events };
    }
    file(filename, res) {
        // basic path-traversal guard
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            throw new common_1.NotFoundException();
        }
        const fp = path.join(EVENTS_DIR, filename);
        if (!fs.existsSync(fp))
            throw new common_1.NotFoundException();
        res.sendFile(fp);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("file/:filename"),
    __param(0, (0, common_1.Param)("filename")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "file", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)("events")
], EventsController);
