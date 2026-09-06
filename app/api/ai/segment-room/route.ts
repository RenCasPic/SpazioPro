import { z } from "zod";
import { badRequest, ok, parseBody } from "@/lib/api/http";
import { getAIProvider } from "@/lib/ai/provider";

const schema = z.object({ imageUrl: z.string().min(1), target: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { imageUrl, target } = await parseBody(request, schema);
    return ok(await getAIProvider().segment(imageUrl, target));
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("Segmentation failed.");
  }
}
