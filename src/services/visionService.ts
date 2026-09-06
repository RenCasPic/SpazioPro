import type { RoomType, VisionResult } from "@/types";
import { getAIProvider } from "./ai";

export const visionService = {
  async analyze(image: string, hintRoomType?: RoomType): Promise<VisionResult> {
    return getAIProvider().analyzeRoom({ image, hintRoomType });
  },
  get isDemo() {
    return getAIProvider().isDemo;
  },
};
