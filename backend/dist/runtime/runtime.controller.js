"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeController = void 0;
const common_1 = require("@nestjs/common");
const runtime_service_1 = require("./runtime.service");
const assembler_service_1 = require("../pipelines/assembler.service");
let RuntimeController = class RuntimeController {
    runtime;
    assembler;
    constructor(runtime, assembler) {
        this.runtime = runtime;
        this.assembler = assembler;
    }
    // ─── Per-node tester ─────────────────────────────────────
    async testNode(req) {
        return this.runtime.testNode(req);
    }
    // ─── Full pipeline runner ────────────────────────────────
    startPipeline(pipeline) {
        const code = this.assembler.compile(pipeline);
        return this.runtime.startPipeline(code);
    }
    stopPipeline(id) {
        return this.runtime.stopPipeline(id);
    }
    listRuns() {
        return { runs: this.runtime.listRuns() };
    }
    getRun(id) {
        const r = this.runtime.getRun(id);
        if (!r)
            throw new common_1.BadRequestException("Unknown run id");
        return {
            id: r.id,
            status: r.status,
            startedAt: r.startedAt,
            exitCode: r.exitCode,
            logs: r.logs,
        };
    }
    /** Server-Sent Events stream of logs as they arrive. */
    stream(id, res) {
        const r = this.runtime.getRun(id);
        if (!r) {
            res.status(400).json({ error: "Unknown run id" });
            return;
        }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        // Replay existing logs
        for (const entry of r.logs) {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        }
        res.write(`event: status\ndata: ${JSON.stringify({ status: r.status })}\n\n`);
        const listener = (entry) => {
            try {
                res.write(`data: ${JSON.stringify(entry)}\n\n`);
            }
            catch { }
        };
        r.listeners.add(listener);
        // Status check + heartbeat
        const heartbeat = setInterval(() => {
            try {
                res.write(`event: status\ndata: ${JSON.stringify({ status: r.status, exitCode: r.exitCode })}\n\n`);
                if (r.status !== "running") {
                    clearInterval(heartbeat);
                    res.end();
                }
            }
            catch {
                clearInterval(heartbeat);
            }
        }, 2000);
        res.on("close", () => {
            r.listeners.delete(listener);
            clearInterval(heartbeat);
        });
    }
};
exports.RuntimeController = RuntimeController;
__decorate([
    (0, common_1.Post)("nodes/test"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RuntimeController.prototype, "testNode", null);
__decorate([
    (0, common_1.Post)("pipelines/run"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "startPipeline", null);
__decorate([
    (0, common_1.Post)("pipelines/runs/:id/stop"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "stopPipeline", null);
__decorate([
    (0, common_1.Get)("pipelines/runs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "listRuns", null);
__decorate([
    (0, common_1.Get)("pipelines/runs/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "getRun", null);
__decorate([
    (0, common_1.Get)("pipelines/runs/:id/stream"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "stream", null);
exports.RuntimeController = RuntimeController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [runtime_service_1.RuntimeService,
        assembler_service_1.AssemblerService])
], RuntimeController);
