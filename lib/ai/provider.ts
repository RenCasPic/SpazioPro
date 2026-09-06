import type {
  AiEstimationInput,
  AiEstimationResult,
  DesignInput,
  DesignResult,
  RoomAnalysis,
  SegmentationResult,
} from "@/types";

export interface VisionProvider {
  analyzeRoom(imageUrl: string, hint?: string): Promise<RoomAnalysis>;
}

export interface SegmentationProvider {
  segment(imageUrl: string, target: string): Promise<SegmentationResult>;
}

export interface ImageGenerationProvider {
  generateDesign(input: DesignInput): Promise<DesignResult>;
}

export interface EstimationProvider {
  estimate(input: AiEstimationInput): Promise<AiEstimationResult>;
}

export interface AIProvider
  extends VisionProvider,
    SegmentationProvider,
    ImageGenerationProvider,
    EstimationProvider {
  readonly id: string;
  readonly isDemo: boolean;
}

import { demoProvider } from "./demo-provider";

let cached: AIProvider | null = null;

/**
 * Active AI provider. `AI_PROVIDER=demo` (the default) needs no network or key.
 * Register a real provider by adding a case and setting AI_PROVIDER + AI_API_KEY.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const id = process.env.NEXT_PUBLIC_AI_PROVIDER ?? process.env.AI_PROVIDER ?? "demo";
  switch (id) {
    // case "provider_a": cached = providerA; break;
    // case "provider_b": cached = providerB; break;
    default:
      cached = demoProvider;
  }
  return cached;
}
