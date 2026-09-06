import type { ProjectType } from "./project";

export interface DetectedSurface {
  type: "floor" | "wall" | "ceiling" | "window" | "door";
  label: string;
  confidence: number;
}

export interface DetectedObject {
  type: string;
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface RoomAnalysis {
  roomType: ProjectType;
  confidence: number;
  surfaces: DetectedSurface[];
  objects: DetectedObject[];
  approximateDimensions?: {
    width?: number;
    length?: number;
    height?: number;
  };
  summary: string;
  isEstimate: true;
}

export interface SegmentationResult {
  target: string;
  /** normalized polygon points (0..1) */
  polygon: Array<{ x: number; y: number }>;
  confidence: number;
}

export interface DesignInput {
  imageUrl: string;
  surface?: "floor" | "wall" | "ceiling";
  productName: string;
  productSwatch: string;
  instruction: string;
}

export interface DesignResult {
  imageUrl?: string;
  /** demo mode returns a CSS filter to apply over the original photo */
  cssFilter?: string;
  note: string;
}

export interface AiEstimationInput {
  roomType: ProjectType;
  dimensions: { width: number; length: number; height: number };
  materialCategories: string[];
  objectCount: number;
}

export interface AiEstimationResult {
  wastePercentByCategory: Record<string, number>;
  suggestedLaborHours: number;
  suggestedItems: Array<{ label: string; category: string; quantity: number; unit: string }>;
  disclaimer: string;
}

export type AiJobType = "analyze" | "segment" | "generate" | "estimate";
export type AiJobStatus = "queued" | "running" | "done" | "error";

export interface AiJob {
  id: string;
  projectId: string | null;
  roomId: string | null;
  type: AiJobType;
  status: AiJobStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
