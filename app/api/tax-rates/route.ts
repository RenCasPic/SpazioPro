import { badRequest, ok } from "@/lib/api/http";
import { taxService } from "@/lib/market/tax-service";

export function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country");
  if (!country) return badRequest("Falta el parámetro ?country=");
  return ok(taxService.ratesForCountry(country));
}
