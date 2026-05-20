export interface PipelineNodeSummary {
  type: string;
  label: string;
  category: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  status: "draft" | "active" | "paused" | "error";
  deployTargets: number;
  createdBy: string;
  lastModified: string;
  model: string;
  modelVersion: string;
  flagged: boolean;
  deployedTo: string[];
  nodes: PipelineNodeSummary[];
  /** NEW — inferred from the categories its nodes span */
  pipelineType?: "vision" | "training" | "end-to-end";
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  icon: string;
}
