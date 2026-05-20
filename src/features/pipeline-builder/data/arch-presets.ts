import type { PresetArch } from "../types/preset.types";

/**
 * Architecture presets. Each stamps a sequence of Architecture/Heads nodes onto the canvas
 * laid out left-to-right with `relativeX`/`relativeY` offsets, and connects them via `edges`.
 */

const COL = 200; // horizontal step per layer

export const PRESETS: PresetArch[] = [
  {
    id: "yolov8-small",
    name: "YOLOv8-Small",
    description: "CSPDarknet + C2f blocks + SPPF + detection head",
    paramCount: "11.2M",
    category: "detection",
    nodes: [
      { type: "tensor_input",     label: "Input [B,3,640,640]", relativeX: 0 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Stem Conv",           overrides: { channels: 32, details: "6×6, s=2" }, relativeX: 1 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Down 1",              overrides: { channels: 64, details: "3×3, s=2" }, relativeX: 2 * COL, relativeY: 0 },
      { type: "c2f",              label: "C2f 1",               overrides: { channels: 64 },                      relativeX: 3 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Down 2",              overrides: { channels: 128, details: "3×3, s=2" }, relativeX: 4 * COL, relativeY: 0 },
      { type: "c2f",              label: "C2f 2",               overrides: { channels: 128 },                     relativeX: 5 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Down 3",              overrides: { channels: 256, details: "3×3, s=2" }, relativeX: 6 * COL, relativeY: 0 },
      { type: "c2f",              label: "C2f 3",               overrides: { channels: 256 },                     relativeX: 7 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Down 4",              overrides: { channels: 512, details: "3×3, s=2" }, relativeX: 8 * COL, relativeY: 0 },
      { type: "c2f",              label: "C2f 4",               overrides: { channels: 512 },                     relativeX: 9 * COL, relativeY: 0 },
      { type: "sppf",             label: "SPPF",                overrides: { channels: 512, details: "kernel=5" }, relativeX: 10 * COL, relativeY: 0 },
      { type: "detect_head",      label: "Detect Head",         overrides: { channels: 256, outputShape: "[B,11,8400]" }, relativeX: 11 * COL, relativeY: 0 },
    ],
    edges: [
      { fromIndex: 0, toIndex: 1 }, { fromIndex: 1, toIndex: 2 }, { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 }, { fromIndex: 4, toIndex: 5 }, { fromIndex: 5, toIndex: 6 },
      { fromIndex: 6, toIndex: 7 }, { fromIndex: 7, toIndex: 8 }, { fromIndex: 8, toIndex: 9 },
      { fromIndex: 9, toIndex: 10 }, { fromIndex: 10, toIndex: 11 },
    ],
  },
  {
    id: "resnet-50",
    name: "ResNet-50",
    description: "Classic bottleneck residual network for classification",
    paramCount: "25.6M",
    category: "classification",
    nodes: [
      { type: "tensor_input",     label: "Input [B,3,224,224]", relativeX: 0 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Stem 7×7",            overrides: { channels: 64, details: "7×7, s=2" }, relativeX: 1 * COL, relativeY: 0 },
      { type: "maxpool",          label: "MaxPool",             overrides: { details: "3×3, s=2" },               relativeX: 2 * COL, relativeY: 0 },
      { type: "residual_block",   label: "Stage 1 (×3)",        overrides: { channels: 256, repeat: 3 },          relativeX: 3 * COL, relativeY: 0 },
      { type: "residual_block",   label: "Stage 2 (×4)",        overrides: { channels: 512, repeat: 4 },          relativeX: 4 * COL, relativeY: 0 },
      { type: "residual_block",   label: "Stage 3 (×6)",        overrides: { channels: 1024, repeat: 6 },         relativeX: 5 * COL, relativeY: 0 },
      { type: "residual_block",   label: "Stage 4 (×3)",        overrides: { channels: 2048, repeat: 3 },         relativeX: 6 * COL, relativeY: 0 },
      { type: "adaptive_avgpool", label: "AvgPool",             overrides: { details: "→ 1×1" },                  relativeX: 7 * COL, relativeY: 0 },
      { type: "flatten",          label: "Flatten",                                                               relativeX: 8 * COL, relativeY: 0 },
      { type: "classify_head",    label: "Classifier (1000)",   overrides: { outputShape: "[B,1000]", params: { numClasses: "1000" } }, relativeX: 9 * COL, relativeY: 0 },
    ],
    edges: [
      { fromIndex: 0, toIndex: 1 }, { fromIndex: 1, toIndex: 2 }, { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 }, { fromIndex: 4, toIndex: 5 }, { fromIndex: 5, toIndex: 6 },
      { fromIndex: 6, toIndex: 7 }, { fromIndex: 7, toIndex: 8 }, { fromIndex: 8, toIndex: 9 },
    ],
  },
  {
    id: "efficientnet-b2",
    name: "EfficientNet-B2",
    description: "Compound-scaled MBConv blocks with SE",
    paramCount: "9.2M",
    category: "classification",
    nodes: [
      { type: "tensor_input",     label: "Input [B,3,260,260]", relativeX: 0 * COL, relativeY: 0 },
      { type: "conv_block",       label: "Stem",                overrides: { channels: 32, details: "3×3, s=2" }, relativeX: 1 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 1",            overrides: { channels: 16 },                      relativeX: 2 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 2",            overrides: { channels: 24 },                      relativeX: 3 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 3",            overrides: { channels: 48 },                      relativeX: 4 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 4",            overrides: { channels: 88 },                      relativeX: 5 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 5",            overrides: { channels: 120 },                     relativeX: 6 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 6",            overrides: { channels: 208 },                     relativeX: 7 * COL, relativeY: 0 },
      { type: "mbconv",           label: "MBConv 7",            overrides: { channels: 352 },                     relativeX: 8 * COL, relativeY: 0 },
      { type: "adaptive_avgpool", label: "AvgPool",                                                               relativeX: 9 * COL, relativeY: 0 },
      { type: "classify_head",    label: "Classifier",          overrides: { outputShape: "[B,1000]", params: { numClasses: "1000" } }, relativeX: 10 * COL, relativeY: 0 },
    ],
    edges: [
      { fromIndex: 0, toIndex: 1 }, { fromIndex: 1, toIndex: 2 }, { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 }, { fromIndex: 4, toIndex: 5 }, { fromIndex: 5, toIndex: 6 },
      { fromIndex: 6, toIndex: 7 }, { fromIndex: 7, toIndex: 8 }, { fromIndex: 8, toIndex: 9 },
      { fromIndex: 9, toIndex: 10 },
    ],
  },
];

export function findPreset(id: string): PresetArch | undefined {
  return PRESETS.find((p) => p.id === id);
}
