import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { AssemblerService, PipelineJson } from "./assembler.service";

@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly assembler: AssemblerService) {}

  @Post("compile")
  compile(@Body() pipeline: PipelineJson, @Res() res: Response) {
    const code = this.assembler.compile(pipeline);
    res.setHeader("Content-Type", "text/x-python");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="inference.py"`,
    );
    res.send(code);
  }

  @Post("compile/preview")
  compilePreview(@Body() pipeline: PipelineJson) {
    return { code: this.assembler.compile(pipeline) };
  }
}
