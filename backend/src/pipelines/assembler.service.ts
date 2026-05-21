import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { resolveFilename } from "../../../shared/yolo-catalog";

export interface PipelineNode {
  id: string;
  type: string;
  config: Record<string, any>;
}
export interface PipelineEdge {
  from: string;
  to: string;
}
export interface PipelineJson {
  schemaVersion: 1;
  name: string;
  /** Legacy — older clients may still send this; ignored if a video_input node is present. */
  input?: { type: "rtsp"; url: string };
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

interface ParsedSnippet {
  imports: string;
  setup: string;
  loop: string;
}

const SNIPPET_DIR = path.resolve(__dirname, "..", "..", "snippets");

const KNOWN_BLOCK_TYPES = new Set([
  "video_input",
  "yolo_model",
  "condition",
  "event_sink",
]);

@Injectable()
export class AssemblerService {
  private snippetCache = new Map<string, ParsedSnippet>();

  compile(pipeline: PipelineJson): string {
    this.validate(pipeline);
    this.normalizeNodes(pipeline);

    const order = this.topoSort(pipeline);

    const imports = new Set<string>();
    const setupLines: string[] = [];
    const loopLines: string[] = [];

    for (const nodeId of order) {
      const node = pipeline.nodes.find((n) => n.id === nodeId)!;
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
        loopLines.push(
          subbed.loop
            .split("\n")
            .map((l) => (l.length ? `    ${l}` : l))
            .join("\n")
            .trimEnd(),
        );
      }
    }

    return this.render(pipeline.name, imports, setupLines, loopLines);
  }

  // ─── helpers ───────────────────────────────────────────

  private validate(p: PipelineJson) {
    if (!p || p.schemaVersion !== 1) throw new BadRequestException("Bad schemaVersion");
    if (!Array.isArray(p.nodes) || p.nodes.length === 0)
      throw new BadRequestException("Pipeline has no nodes");
    const hasInput = p.nodes.some((n) => n.type === "video_input");
    if (!hasInput && !p.input?.url)
      throw new BadRequestException("Pipeline needs a video_input node or legacy input.url");

    const ids = new Set(p.nodes.map((n) => n.id));
    for (const e of p.edges || []) {
      if (e.from !== "input" && !ids.has(e.from))
        throw new BadRequestException(`Edge from unknown node: ${e.from}`);
      if (!ids.has(e.to)) throw new BadRequestException(`Edge to unknown node: ${e.to}`);
    }

    for (const n of p.nodes) {
      if (!KNOWN_BLOCK_TYPES.has(n.type)) {
        throw new BadRequestException(`Unknown block type: ${n.type}`);
      }
    }
  }

  /**
   * If the pipeline used the legacy `input.url` field (no video_input node), synthesize one
   * so the rest of the assembler is uniform. Also rewires any edge from "input" to the
   * synthesized node.
   */
  private normalizeNodes(p: PipelineJson) {
    const hasInput = p.nodes.some((n) => n.type === "video_input");
    if (!hasInput && p.input?.url) {
      const syntheticId = "_video_input";
      p.nodes.unshift({
        id: syntheticId,
        type: "video_input",
        config: { source: p.input.url, fps: 5 },
      });
      p.edges = (p.edges || []).map((e) =>
        e.from === "input" ? { ...e, from: syntheticId } : e,
      );
    }
  }

  /** Make a node id safe to use as a Python identifier (and as a dict key consistently). */
  private safeId(id: string): string {
    let s = String(id).replace(/[^a-zA-Z0-9_]/g, "_");
    if (!/^[a-zA-Z_]/.test(s)) s = "n_" + s;
    return s;
  }

  /** Build the per-node substitution context, handling block-specific derived fields. */
  private buildContext(node: PipelineNode, inputId: string | null): Record<string, any> {
    const ctx: Record<string, any> = {
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
      // Rules are a structured object — pass the JSON string straight through.
      // The snippet wraps it in a triple-quoted string and json.loads() it.
      // Escape any triple-quote sequences just in case (shouldn't happen with JSON).
      const rules = node.config.rules ?? { combinator: "AND", rules: [] };
      const json = JSON.stringify(rules).replace(/"""/g, '\\"\\"\\"');
      ctx.rules = json;
    }

    if (node.type === "video_input") {
      ctx.source = node.config.source ?? "";
      ctx.fps = node.config.fps ?? 5;
    }

    return ctx;
  }

  /**
   * Map { version, task, size } to a YOLO weights filename.
   *
   * Resolution order:
   *   1. If cfg.weights is set explicitly (user-provided path or filename), use it.
   *   2. Look up (version, task, size) in the shared catalog — handles every
   *      family-specific irregularity (v9 t/c/e, v10 b, v3 tiny/spp, v5 'u' suffix,
   *      v11/12/26 dropping the 'v', etc.).
   *   3. Fall back to string concat (`${version}${size}${suffix}.pt`) for unknown
   *      combinations — covers custom user uploads.
   *
   * After resolving the filename, prefer a local copy in backend/models/ (returns
   * an absolute Windows-safe path). Otherwise return the bare filename so
   * Ultralytics auto-downloads it on first use.
   */
  resolveWeights(cfg: Record<string, any>): string {
    // Explicit override wins.
    if (typeof cfg.weights === "string" && cfg.weights.trim()) {
      return this.localizeIfPresent(cfg.weights.trim());
    }

    const version = String(cfg.version ?? "yolo26").toLowerCase();
    const size = String(cfg.size ?? "n").toLowerCase();
    const task = String(cfg.task ?? "detect").toLowerCase();

    const fromCatalog = resolveFilename(version, task, size);
    if (fromCatalog) return this.localizeIfPresent(fromCatalog);

    // Defensive fallback: same naming the picker used to assume.
    const taskSuffix: Record<string, string> = {
      detect: "",
      segment: "-seg",
      classify: "-cls",
      pose: "-pose",
      obb: "-obb",
    };
    const filename = `${version}${size}${taskSuffix[task] ?? ""}.pt`;
    return this.localizeIfPresent(filename);
  }

  /** If the file exists in backend/models/, return its absolute (forward-slashed) path. */
  private localizeIfPresent(filename: string): string {
    // Already an absolute path? Return as-is (normalized).
    if (path.isAbsolute(filename)) return filename.replace(/\\/g, "/");
    const localPath = path.resolve(__dirname, "..", "..", "models", filename);
    if (fs.existsSync(localPath)) return localPath.replace(/\\/g, "/");
    return filename;
  }

  private findInputFor(nodeId: string, p: PipelineJson): string | null {
    const edge = (p.edges || []).find((e) => e.to === nodeId);
    return edge ? edge.from : null;
  }

  private topoSort(p: PipelineJson): string[] {
    const indeg = new Map<string, number>();
    const adj = new Map<string, string[]>();
    p.nodes.forEach((n) => {
      indeg.set(n.id, 0);
      adj.set(n.id, []);
    });
    (p.edges || []).forEach((e) => {
      if (adj.has(e.from)) {
        adj.get(e.from)!.push(e.to);
        indeg.set(e.to, (indeg.get(e.to) || 0) + 1);
      }
    });
    const q: string[] = [];
    indeg.forEach((v, k) => v === 0 && q.push(k));
    const out: string[] = [];
    while (q.length) {
      const x = q.shift()!;
      out.push(x);
      for (const y of adj.get(x) || []) {
        indeg.set(y, (indeg.get(y) || 0) - 1);
        if (indeg.get(y) === 0) q.push(y);
      }
    }
    if (out.length !== p.nodes.length)
      throw new BadRequestException("Pipeline has a cycle");
    return out;
  }

  private loadSnippet(type: string): ParsedSnippet {
    const file = path.join(SNIPPET_DIR, `${type}.py`);
    if (!fs.existsSync(file))
      throw new BadRequestException(`No snippet for block type: ${type}`);
    // Use mtime as cache key so edits to snippet .py files are picked up
    // without restarting the backend (ts-node-dev only watches .ts files).
    const mtime = fs.statSync(file).mtimeMs;
    const cacheKey = `${type}:${mtime}`;
    const cached = this.snippetCache.get(cacheKey);
    if (cached) return cached;
    const raw = fs.readFileSync(file, "utf8");
    const parsed = this.parseSections(raw);
    this.snippetCache.set(cacheKey, parsed);
    return parsed;
  }

  private parseSections(src: string): ParsedSnippet {
    const sections: Record<string, string[]> = { imports: [], setup: [], loop: [] };
    let cur: keyof typeof sections | null = null;
    for (const line of src.split("\n")) {
      const m = line.match(/^\s*#\s*\[(imports|setup|loop)\]\s*$/);
      if (m) {
        cur = m[1] as keyof typeof sections;
        continue;
      }
      if (cur) sections[cur].push(line);
    }
    return {
      imports: sections.imports.join("\n").trim(),
      setup: sections.setup.join("\n").trim(),
      loop: sections.loop.join("\n").trim(),
    };
  }

  /** Escape a string so it's safe to drop ANYWHERE inside a Python double-quoted string literal. */
  private escapePyStr(s: string): string {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t");
  }

  /** Keys whose values are user-supplied strings that may end up inside a Python string literal.
   *  These values are always escape-sanitized before substitution. */
  private static STRING_KEYS = new Set<string>([
    "source", "url", "output_dir", "weights", "task", "model", "filename",
    "node_id", "input_id", "node_id_raw",
  ]);

  /** Keys whose values are non-string Python literals (numbers, lists, True/False).
   *  These are rendered as-is and must NOT be wrapped in quotes in the snippet template. */
  private static LITERAL_KEYS = new Set<string>([
    "classes", "fps", "confidence", "min_confidence",
    "save_screenshot", "save_clip", "tracking",
    "clip_seconds", "clip_fps", "cooldown_seconds",
    "rules", // JSON string passed as-is into a Python triple-quoted literal
  ]);

  private substitute(text: string, ctx: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!(key in ctx)) return match;
      const v = ctx[key];

      if (AssemblerService.LITERAL_KEYS.has(key)) {
        if (Array.isArray(v)) return JSON.stringify(v);
        return String(v);
      }

      if (AssemblerService.STRING_KEYS.has(key)) {
        return this.escapePyStr(String(v));
      }

      // Fallback for anything not classified — be safe and escape as string.
      if (Array.isArray(v)) return JSON.stringify(v);
      return this.escapePyStr(String(v));
    });
  }

  private render(
    name: string,
    imports: Set<string>,
    setup: string[],
    loop: string[],
  ): string {
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
}
