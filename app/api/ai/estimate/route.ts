import { z } from "zod";
import { badRequest, ok, parseBody } from "@/lib/api/http";
import { getAIProvider } from "@/lib/ai/provider";

const schema = z.object({
  roomType: z.string(),
  dimensions: z.object({ widthIn: z.number(), lengthIn: z.number(), heightIn: z.number() }),
  materialCategories: z.array(z.string()).default([]),
  objectCount: z.number().default(0),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return ok(await getAIProvider().estimate({ ...body, roomType: body.roomType as never }));
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("Estimation failed.");
  }
}
