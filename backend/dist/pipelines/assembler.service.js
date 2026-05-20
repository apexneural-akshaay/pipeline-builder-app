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
var AssemblerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblerService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SNIPPET_DIR = path.resolve(__dirname, "..", "..", "snippets");
const KNOWN_BLOCK_TYPES = new Set([
    "video_input",
    "yolo_model",
    "condition",
    "event_sink",
]);
let AssemblerService = class AssemblerService {
    static { AssemblerService_1 = this; }
    snippetCache = new Map();
    compile(pipeline) {
        this.validate(pipeline);
        this.normalizeNodes(pipeline);
        const order = this.topoSort(pipeline);
        const imports = new Set();
        const setupLines = [];
        const loopLines = [];
        for (const nodeId of order) {
            const node = pipeline.nodes.find((n) => n.id === nodeId);
            const snippet = this.loadSnippet(node.type);
            const inputId = this.findInputFor(nodeId, pipeline);
            const ctx = this.buildContext(node, inputId);
            const subbed = {
                imports: this.substitute(snippet.imports, ctx),
                setup: this.substitute(snippet.setup, ctx),
                loop: this.substitute(snippet.loop, ctx),
            };
            subbed.imports
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .forEach((l) => imports.add(l));
            if (subbed.setup.trim()) {
                setupLines.push(`# ── ${node.type} (${node.id}) ──`);
                setupLines.push(subbed.setup.trimEnd());
                setupLines.push("");
            }
            if (subbed.loop.trim()) {
                loopLines.push(`    # ── ${node.type} (${node.id}) ──`);
                loopLines.push(subbed.loop
                    .split("\n")
                    .map((l) => (l.length ? `    ${l}` : l))
                    .join("\n")
                    .trimEnd());
            }
        }
        return this.render(pipeline.name, imports, setupLines, loopLines);
    }
    // ─── helpers ───────────────────────────────────────────
    validate(p) {
        if (!p || p.schemaVersion !== 1)
            throw new common_1.BadRequestException("Bad schemaVersion");
        if (!Array.isArray(p.nodes) || p.nodes.length === 0)
            throw new common_1.BadRequestException("Pipeline has no nodes");
        const hasInput = p.nodes.some((n) => n.type === "video_input");
        if (!hasInput && !p.input?.url)
            throw new common_1.BadRequestException("Pipeline needs a video_input node or legacy input.url");
        const ids = new Set(p.nodes.map((n) => n.id));
        for (const e of p.edges || []) {
            if (e.from !== "input" && !ids.has(e.from))
                throw new common_1.BadRequestException(`Edge from unknown node: ${e.from}`);
            if (!ids.has(e.to))
                throw new common_1.BadRequestException(`Edge to unknown node: ${e.to}`);
        }
        for (const n of p.nodes) {
            if (!KNOWN_BLOCK_TYPES.has(n.type)) {
                throw new common_1.BadRequestException(`Unknown block type: ${n.type}`);
            }
        }
    }
    /**
     * If the pipeline used the legacy `input.url` field (no video_input node), synthesize one
     * so the rest of the assembler is uniform. Also rewires any edge from "input" to the
     * synthesized node.
     */
    normalizeNodes(p) {
        const hasInput = p.nodes.some((n) => n.type === "video_input");
        if (!hasInput && p.input?.url) {
            const syntheticId = "_video_input";
            p.nodes.unshift({
                id: syntheticId,
                type: "video_input",
                config: { source: p.input.url, fps: 5 },
            });
            p.edges = (p.edges || []).map((e) => e.from === "input" ? { ...e, from: syntheticId } : e);
        }
    }
    /** Make a node id safe to use as a Python identifier (and as a dict key consistently). */
    safeId(id) {
        let s = String(id).replace(/[^a-zA-Z0-9_]/g, "_");
        if (!/^[a-zA-Z_]/.test(s))
            s = "n_" + s;
        return s;
    }
    /** Build the per-node substitution context, handling block-specific derived fields. */
    buildContext(node, inputId) {
        const ctx = {
            ...node.config,
            node_id: this.safeId(node.id),
            input_id: inputId ? this.safeId(inputId) : "",
            // The original (un-sanitized) id, used in heartbeat output so the frontend
            // can match it against canvas node ids.
            node_id_raw: node.id,
        };
        if (node.type === "yolo_model") {
            ctx.weights = this.resolveWeights(node.config);
            ctx.task = node.config.task ?? "detect";
            ctx.classes = Array.isArray(node.config.classes) ? node.config.classes : [];
            ctx.confidence = node.config.confidence ?? 0.5;
            ctx.tracking = node.config.tracking ? "True" : "False";
        }
        if (node.type === "event_sink") {
            // We always write to backend/events/ regardless of what the user typed, so the
            // Events page reliably finds the output. The freeform "Output folder" field is
            // accepted for backward-compatibility but is essentially advisory at this point.
            const abs = path.resolve(__dirname, "..", "..", "events");
            ctx.output_dir = abs.replace(/\\/g, "/");
            ctx.save_screenshot = node.config.save_screenshot ? "True" : "False";
            ctx.save_clip = node.config.save_clip ? "True" : "False";
            ctx.clip_seconds = node.config.clip_seconds ?? 10;
            ctx.clip_fps = node.config.clip_fps ?? 15;
            ctx.cooldown_seconds = node.config.cooldown_seconds ?? 5;
        }
        if (node.type === "condition") {
            ctx.classes = Array.isArray(node.config.classes) ? node.config.classes : [];
            ctx.min_confidence = node.config.min_confidence ?? 0.5;
        }
        if (node.type === "video_input") {
            ctx.source = node.config.source ?? "";
            ctx.fps = node.config.fps ?? 5;
        }
        return ctx;
    }
    /**
     * Map { version, task, size } to a YOLO weights filename.
     * version: "yolov5" | "yolov6" | "yolov7" | "yolov8" | "yolov9" | "yolov10" | "yolo11" | "yolo12" | "yolo26"
     * task:    "detect" | "segment" | "classify" | "pose" | "obb"
     * size:    "n" | "s" | "m" | "l" | "x" (some versions use different letters; we keep it simple)
     */
    resolveWeights(cfg) {
        const version = String(cfg.version ?? "yolo26").toLowerCase();
        const size = String(cfg.size ?? "n").toLowerCase();
        const task = String(cfg.task ?? "detect").toLowerCase();
        const taskSuffix = {
            detect: "",
            segment: "-seg",
            classify: "-cls",
            pose: "-pose",
            obb: "-obb",
        };
        const suffix = taskSuffix[task] ?? "";
        const filename = `${version}${size}${suffix}.pt`;
        // Prefer the locally-bundled weight in backend/models/. Resolve to absolute path so
        // the generated inference.py works from any cwd. Fall back to the bare name so
        // Ultralytics auto-downloads if the file isn't there.
        const localPath = path.resolve(__dirname, "..", "..", "models", filename);
        if (fs.existsSync(localPath)) {
            // Use forward slashes so the Python string literal is portable on Windows
            return localPath.replace(/\\/g, "/");
        }
        return filename;
    }
    findInputFor(nodeId, p) {
        const edge = (p.edges || []).find((e) => e.to === nodeId);
        return edge ? edge.from : null;
    }
    topoSort(p) {
        const indeg = new Map();
        const adj = new Map();
        p.nodes.forEach((n) => {
            indeg.set(n.id, 0);
            adj.set(n.id, []);
        });
        (p.edges || []).forEach((e) => {
            if (adj.has(e.from)) {
                adj.get(e.from).push(e.to);
                indeg.set(e.to, (indeg.get(e.to) || 0) + 1);
            }
        });
        const q = [];
        indeg.forEach((v, k) => v === 0 && q.push(k));
        const out = [];
        while (q.length) {
            const x = q.shift();
            out.push(x);
            for (const y of adj.get(x) || []) {
                indeg.set(y, (indeg.get(y) || 0) - 1);
                if (indeg.get(y) === 0)
                    q.push(y);
            }
        }
        if (out.length !== p.nodes.length)
            throw new common_1.BadRequestException("Pipeline has a cycle");
        return out;
    }
    loadSnippet(type) {
        if (this.snippetCache.has(type))
            return this.snippetCache.get(type);
        const file = path.join(SNIPPET_DIR, `${type}.py`);
        if (!fs.existsSync(file))
            throw new common_1.BadRequestException(`No snippet for block type: ${type}`);
        const raw = fs.readFileSync(file, "utf8");
        const parsed = this.parseSections(raw);
        this.snippetCache.set(type, parsed);
        return parsed;
    }
    parseSections(src) {
        const sections = { imports: [], setup: [], loop: [] };
        let cur = null;
        for (const line of src.split("\n")) {
            const m = line.match(/^\s*#\s*\[(imports|setup|loop)\]\s*$/);
            if (m) {
                cur = m[1];
                continue;
            }
            if (cur)
                sections[cur].push(line);
        }
        return {
            imports: sections.imports.join("\n").trim(),
            setup: sections.setup.join("\n").trim(),
            loop: sections.loop.join("\n").trim(),
        };
    }
    /** Escape a string so it's safe to drop ANYWHERE inside a Python double-quoted string literal. */
    escapePyStr(s) {
        return s
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t");
    }
    /** Keys whose values are user-supplied strings that may end up inside a Python string literal.
     *  These values are always escape-sanitized before substitution. */
    static STRING_KEYS = new Set([
        "source", "url", "output_dir", "weights", "task", "model", "filename",
        "node_id", "input_id", "node_id_raw",
    ]);
    /** Keys whose values are non-string Python literals (numbers, lists, True/False).
     *  These are rendered as-is and must NOT be wrapped in quotes in the snippet template. */
    static LITERAL_KEYS = new Set([
        "classes", "fps", "confidence", "min_confidence",
        "save_screenshot", "save_clip", "tracking",
        "clip_seconds", "clip_fps", "cooldown_seconds",
    ]);
    substitute(text, ctx) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (!(key in ctx))
                return match;
            const v = ctx[key];
            if (AssemblerService_1.LITERAL_KEYS.has(key)) {
                if (Array.isArray(v))
                    return JSON.stringify(v);
                return String(v);
            }
            if (AssemblerService_1.STRING_KEYS.has(key)) {
                return this.escapePyStr(String(v));
            }
            // Fallback for anything not classified — be safe and escape as string.
            if (Array.isArray(v))
                return JSON.stringify(v);
            return this.escapePyStr(String(v));
        });
    }
    render(name, imports, setup, loop) {
        const importsBlock = Array.from(imports).sort().join("\n");
        const safeName = JSON.stringify(name);
        return [
            `# AUTO-GENERATED — do not edit by hand`,
            `# Pipeline: ${name}`,
            ``,
            importsBlock,
            ``,
            `PIPELINE_NAME = ${safeName}`,
            `state = {}`,
            ``,
            `# ─── setup ─────────────────────────────────────────`,
            setup.join("\n"),
            ``,
            `# ─── main loop ─────────────────────────────────────`,
            `# Stop is delivered by the host as a signal (SIGTERM); atexit handlers will flush.`,
            `while True:`,
            loop.join("\n"),
            ``,
        ].join("\n");
    }
};
exports.AssemblerService = AssemblerService;
exports.AssemblerService = AssemblerService = AssemblerService_1 = __decorate([
    (0, common_1.Injectable)()
], AssemblerService);
