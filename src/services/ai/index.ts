import type { AIProvider } from "./types";
import { demoProvider } from "./demoProvider";

export * from "./types";

let cached: AIProvider | null = null;

/**
 * Returns the active AI provider. Reads `NEXT_PUBLIC_AI_PROVIDER` (client-safe)
 * or falls back to the fully offline demo provider.
 *
 * To add a real provider:
 *   1. create `./providers/openaiProvider.ts` implementing `AIProvider`
 *   2. register it in the switch below
 *   3. set NEXT_PUBLIC_AI_PROVIDER=openai and AI_API_KEY=... in .env.local
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const id = process.env.NEXT_PUBLIC_AI_PROVIDER ?? "demo";
  switch (id) {
    // case "openai":
    //   cached = openaiProvider;
    //   break;
    default:
      cached = demoProvider;
  }
  return cached;
}
