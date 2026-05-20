export interface PresetNodeDef {
  type: string;
  label?: string;
  overrides?: {
    channels?: number;
    details?: string;
    outputShape?: string;
    params?: Record<string, string>;
    repeat?: number;
  };
  relativeX: number;
  relativeY: number;
}

export interface PresetEdgeDef {
  fromIndex: number;
  toIndex: number;
}

export interface PresetArch {
  id: string;
  name: string;
  description: string;
  paramCount: string;
  category: "detection" | "classification" | "segmentation";
  nodes: PresetNodeDef[];
  edges: PresetEdgeDef[];
}
