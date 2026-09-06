import { notFound, ok } from "@/lib/api/http";
import { stateService } from "@/lib/market/country-service";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const state = stateService.get(code);
  return state ? ok(state) : notFound("State not found");
}
