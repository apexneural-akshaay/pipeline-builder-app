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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const NODE_RUNNER = path.resolve(__dirname, "..", "..", "runtime", "node_runner.py");
const RUNS_DIR = path.resolve(__dirname, "..", "..", "runs");
if (!fs.existsSync(RUNS_DIR))
    fs.mkdirSync(RUNS_DIR, { recursive: true });
/** Resolve a real, working Python executable.
 *  On Windows, "python" in PATH often points at the Microsoft Store stub which hangs
 *  silently when spawned by a child process. We probe candidates to find a real one.
 */
function resolvePython() {
    if (process.env.PYTHON_CMD)
        return process.env.PYTHON_CMD;
    const { execSync } = require("child_process");
    const candidates = [];
    // Try the `py` launcher first — Windows official way to find the real interpreter
    for (const cmd of ["py -3", "py"]) {
        try {
            const out = execSync(`${cmd} -c "import sys; print(sys.executable)"`, { encoding: "utf8", timeout: 5000 });
            const path = out.trim();
            if (path && !path.toLowerCase().includes("windowsapps"))
                candidates.push(path);
        }
        catch { }
    }
    // Probe each "python" / "python3" / "python.exe" entry on PATH, skipping the Store stub
    for (const cmd of ["python", "python3", "python.exe"]) {
        try {
            const out = execSync(`${process.platform === "win32" ? "where" : "which"} ${cmd}`, { encoding: "utf8", timeout: 5000 });
            for (const line of out.split(/\r?\n/)) {
                const path = line.trim();
                if (!path)
                    continue;
                if (path.toLowerCase().includes("windowsapps"))
                    continue; // Skip MS Store stub
                candidates.push(path);
            }
        }
        catch { }
    }
    // Pick the first candidate that actually loads Python successfully (not the Store stub)
    for (const c of candidates) {
        try {
            const out = execSync(`"${c}" -c "import sys; print(sys.version_info[:2])"`, { encoding: "utf8", timeout: 5000 });
            if (/\(\d/.test(out)) {
                console.log(`runtime: using python at ${c}`);
                return c;
            }
        }
        catch { }
    }
    console.warn("runtime: no real Python found; falling back to 'python' on PATH (may hang on Windows Store stub)");
    return "python";
}
const PYTHON_CMD = resolvePython();
let RuntimeService = class RuntimeService {
    runs = new Map();
    // ─── Per-node test ───────────────────────────────────────
    async testNode(req) {
        if (!req?.nodeType)
            throw new common_1.BadRequestException("nodeType required");
        return new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)(PYTHON_CMD, [NODE_RUNNER, req.nodeType, JSON.stringify(req.config ?? {})]);
            let stdout = "";
            let stderr = "";
            proc.stdout.on("data", (d) => (stdout += d.toString()));
            proc.stderr.on("data", (d) => (stderr += d.toString()));
            proc.on("error", (err) => reject(new common_1.InternalServerErrorException(err.message)));
            proc.on("close", () => {
                // The runner always prints exactly one JSON object on stdout
                try {
                    const parsed = JSON.parse(stdout.trim().split("\n").pop() || "{}");
                    resolve({ ...parsed, stderr_tail: stderr.split("\n").slice(-20).join("\n") });
                }
                catch (e) {
                    resolve({ ok: false, error: "Failed to parse runner output", stdout, stderr });
                }
            });
            if (req.upstream !== undefined && req.upstream !== null) {
                proc.stdin.write(JSON.stringify(req.upstream));
            }
            proc.stdin.end();
        });
    }
    // ─── Full pipeline run ───────────────────────────────────
    startPipeline(code) {
        const runId = (0, crypto_1.randomUUID)();
        const workDir = path.join(RUNS_DIR, runId);
        fs.mkdirSync(workDir, { recursive: true });
        const scriptPath = path.join(workDir, "inference.py");
        fs.writeFileSync(scriptPath, code, "utf8");
        const proc = (0, child_process_1.spawn)(PYTHON_CMD, ["-u", scriptPath], {
            cwd: workDir,
            env: { ...process.env, PYTHONUNBUFFERED: "1" },
            // Important: explicit stdio so Node doesn't keep a stdin pipe open that
            // would let Python's stdin block stdout flushing on Windows.
            stdio: ["ignore", "pipe", "pipe"],
        });
        const record = {
            id: runId,
            startedAt: Date.now(),
            status: "running",
            exitCode: null,
            proc,
            logs: [],
            listeners: new Set(),
            workDir,
        };
        this.runs.set(runId, record);
        const append = (stream, line) => {
            const entry = { time: Date.now(), stream, line };
            record.logs.push(entry);
            if (record.logs.length > 5000)
                record.logs.shift();
            record.listeners.forEach((l) => {
                try {
                    l(entry);
                }
                catch { }
            });
        };
        proc.stdout.on("data", (d) => d.toString().split(/\r?\n/).forEach((l) => l && append("stdout", l)));
        proc.stderr.on("data", (d) => d.toString().split(/\r?\n/).forEach((l) => l && append("stderr", l)));
        proc.on("error", (err) => {
            append("meta", `[runtime] spawn error: ${err.message}`);
            record.status = "failed";
            record.proc = null;
        });
        proc.on("close", (code) => {
            record.status = record.status === "stopped" ? "stopped" : "exited";
            record.exitCode = code;
            record.proc = null;
            append("meta", `[runtime] process exited with code ${code}`);
        });
        append("meta", `[runtime] starting inference.py in ${workDir}`);
        return { runId };
    }
    stopPipeline(runId) {
        const r = this.runs.get(runId);
        if (!r)
            throw new common_1.BadRequestException("Unknown run id");
        if (r.proc) {
            r.status = "stopped";
            try {
                r.proc.kill("SIGTERM");
            }
            catch { }
            // Force-kill after a grace period
            setTimeout(() => {
                if (r.proc && !r.proc.killed) {
                    try {
                        r.proc.kill("SIGKILL");
                    }
                    catch { }
                }
            }, 3000);
        }
        return { ok: true };
    }
    getRun(runId) {
        return this.runs.get(runId);
    }
    listRuns() {
        return Array.from(this.runs.values()).map((r) => ({
            id: r.id,
            startedAt: r.startedAt,
            status: r.status,
            exitCode: r.exitCode,
            logCount: r.logs.length,
        }));
    }
};
exports.RuntimeService = RuntimeService;
exports.RuntimeService = RuntimeService = __decorate([
    (0, common_1.Injectable)()
], RuntimeService);
