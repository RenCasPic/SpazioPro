import type { RoomAnalysis } from "@/types";
import { getAIProvider } from "./provider";

export const vision = {
  analyzeRoom(imageUrl: string, hint?: string): Promise<RoomAnalysis> {
    return getAIProvider().analyzeRoom(imageUrl, hint);
  },
  get isDemo() {
    return getAIProvider().isDemo;
  },
};
