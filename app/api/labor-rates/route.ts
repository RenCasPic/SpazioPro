import { badRequest, ok } from "@/lib/api/http";
import { laborRateService } from "@/lib/market/labor-rate-service";

export function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country");
  if (!country) return badRequest("Falta el parámetro ?country=");
  return ok(laborRateService.forCountry(country));
}
