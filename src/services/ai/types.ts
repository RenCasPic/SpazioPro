import type { Dimensions, RoomType, VisionResult } from "@/types";

/**
 * Provider-agnostic AI surface. Implement this once per vendor
 * (OpenAI, Anthropic, Replicate, a self-hosted model…) and register it
 * in `getAIProvider()`. The rest of the app never imports a vendor SDK.
 */
export interface AIProvider {
  readonly id: string;
  readonly isDemo: boolean;

  /** Analyse a room photo and describe its surfaces, objects and size. */
  analyzeRoom(input: VisionInput): Promise<VisionResult>;

  /** Return a design preview for the photo with a material/instruction applied. */
  generateDesign(input: ImageEditInput): Promise<ImageEditResult>;

  /** Estimate quantities / budget hints for a room + selection. */
  estimate(input: EstimationInput): Promise<EstimationResult>;
}

export interface VisionInput {
  /** data URL or remote URL of the room photo */
  image: string;
  hintRoomType?: RoomType;
}

export interface ImageEditInput {
  image: string;
  /** normalized mask polygon points (0..1) — optional in demo mode */
  mask?: Array<{ x: number; y: number }>;
  surface?: "floor" | "wall" | "ceiling";
  productName: string;
  productSwatch: string;
  instruction: string;
}

export interface ImageEditResult {
  /**
   * Either a full replacement image (`imageUrl`) or, in demo mode, a
   * CSS filter descriptor the client applies over the original photo.
   */
  imageUrl?: string;
  cssFilter?: string;
  note: string;
}

export interface EstimationInput {
  roomType: RoomType;
  dimensions: Dimensions;
  materialCategories: string[];
  objectCount: number;
}

export interface EstimationResult {
  /** suggested waste percentage per surface material */
  wastePctByCategory: Record<string, number>;
  /** rough labour hours suggestion */
  suggestedLaborHours: number;
  disclaimer: string;
}
