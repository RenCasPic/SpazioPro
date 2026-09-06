import { z } from "zod";
import { badRequest, ok, parseBody } from "@/lib/api/http";
import { getAIProvider } from "@/lib/ai/provider";

const schema = z.object({
  imageUrl: z.string().min(1),
  surface: z.enum(["floor", "wall", "ceiling"]).optional(),
  productName: z.string().min(1),
  productSwatch: z.string().default("#cccccc"),
  instruction: z.string().default(""),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return ok(await getAIProvider().generateDesign(body));
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("Design generation failed.");
  }
}
