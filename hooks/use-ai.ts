"use client";

import { useState } from "react";
import type { RoomAnalysis } from "@/types";
import { vision } from "@/lib/ai/vision";

export function useRoomAnalysis() {
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(imageUrl: string, hint?: string) {
    setRunning(true);
    setError(null);
    try {
      const result = await vision.analyzeRoom(imageUrl, hint);
      setAnalysis(result);
      return result;
    } catch {
      setError("We couldn't analyze this image. Check that it's well lit and the space is visible.");
      return null;
    } finally {
      setRunning(false);
    }
  }

  return { analysis, running, error, analyze, setAnalysis, isDemo: vision.isDemo };
}
