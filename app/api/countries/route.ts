import { ok } from "@/lib/api/http";
import { countryService } from "@/lib/market/country-service";

export function GET() {
  return ok(countryService.list(false));
}
