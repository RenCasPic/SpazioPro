import { badRequest, ok } from "@/lib/api/http";
import { taxService } from "@/lib/market/tax-service";

export function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const state = p.get("state");
  if (!state) return badRequest("Missing ?state=");
  return ok(
    taxService.getTaxRate({
      stateCode: state.toUpperCase(),
      county: p.get("county") ?? undefined,
      city: p.get("city") ?? undefined,
      zipCode: p.get("zip") ?? undefined,
    }),
  );
}
