import type { AiEstimationInput, AiEstimationResult } from "@/types";
import { getAIProvider } from "./provider";

export const aiEstimation = {
  estimate(input: AiEstimationInput): Promise<AiEstimationResult> {
    return getAIProvider().estimate(input);
  },
};
