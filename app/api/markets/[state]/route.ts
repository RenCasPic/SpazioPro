import { ok } from "@/lib/api/http";
import { marketService } from "@/lib/market/market-service";

export async function GET(_req: Request, { params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return ok(marketService.get(state.toUpperCase()));
}
