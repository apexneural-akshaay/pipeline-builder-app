import { Module } from "@nestjs/common";
import { PipelinesController } from "./pipelines/pipelines.controller";
import { AssemblerService } from "./pipelines/assembler.service";
import { UploadsController } from "./uploads/uploads.controller";
import { ModelsController } from "./models/models.controller";
import { ClassesController } from "./models/classes.controller";
import { CatalogController } from "./models/catalog.controller";
import { DownloadsController } from "./models/downloads.controller";
import { DownloadsService } from "./models/downloads.service";
import { EventsController } from "./events/events.controller";
import { RuntimeController } from "./runtime/runtime.controller";
import { RuntimeService } from "./runtime/runtime.service";

@Module({
  controllers: [
    PipelinesController,
    UploadsController,
    ModelsController,
    ClassesController,
    CatalogController,
    DownloadsController,
    EventsController,
    RuntimeController,
  ],
  providers: [AssemblerService, RuntimeService, DownloadsService],
})
export class AppModule {}
