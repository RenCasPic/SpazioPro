import { ok } from "@/lib/api/http";
import { laborRateService } from "@/lib/market/labor-rate-service";

export function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state");
  return ok(laborRateService.forState(state ? state.toUpperCase() : null));
}
