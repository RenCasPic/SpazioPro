import type { SegmentationResult } from "@/types";
import { getAIProvider } from "./provider";

export const segmentation = {
  segment(imageUrl: string, target: string): Promise<SegmentationResult> {
    return getAIProvider().segment(imageUrl, target);
  },
};
