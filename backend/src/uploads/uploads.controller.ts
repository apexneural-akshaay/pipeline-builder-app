import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller("uploads")
export class UploadsController {
  @Post("video")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          cb(null, `${Date.now()}_${safe}`);
        },
      }),
      limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
      fileFilter: (_req, file, cb) => {
        if (!/\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.originalname)) {
          return cb(new BadRequestException("Unsupported video format") as any, false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException("No file uploaded");
    // Normalize to forward slashes so the path is safe to embed in Python string literals.
    const path = String(file.path).replace(/\\/g, "/");
    return { filename: file.filename, size: file.size, path };
  }
}
