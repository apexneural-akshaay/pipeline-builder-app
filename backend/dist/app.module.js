"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const pipelines_controller_1 = require("./pipelines/pipelines.controller");
const assembler_service_1 = require("./pipelines/assembler.service");
const uploads_controller_1 = require("./uploads/uploads.controller");
const models_controller_1 = require("./models/models.controller");
const classes_controller_1 = require("./models/classes.controller");
const events_controller_1 = require("./events/events.controller");
const runtime_controller_1 = require("./runtime/runtime.controller");
const runtime_service_1 = require("./runtime/runtime.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [pipelines_controller_1.PipelinesController, uploads_controller_1.UploadsController, models_controller_1.ModelsController, classes_controller_1.ClassesController, events_controller_1.EventsController, runtime_controller_1.RuntimeController],
        providers: [assembler_service_1.AssemblerService, runtime_service_1.RuntimeService],
    })
], AppModule);
