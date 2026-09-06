import { ok } from "@/lib/api/http";
import { stateService } from "@/lib/market/country-service";

export function GET() {
  return ok(stateService.list());
}
