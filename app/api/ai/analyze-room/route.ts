import { z } from "zod";
import { badRequest, ok, parseBody } from "@/lib/api/http";
import { getAIProvider } from "@/lib/ai/provider";

const schema = z.object({ imageUrl: z.string().min(1), hint: z.string().optional() });

export async function POST(request: Request) {
  try {
    const { imageUrl, hint } = await parseBody(request, schema);
    return ok(await getAIProvider().analyzeRoom(imageUrl, hint));
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("We couldn't analyze this image.");
  }
}
