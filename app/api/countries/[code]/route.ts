import { notFound, ok } from "@/lib/api/http";
import { countryService } from "@/lib/market/country-service";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const country = countryService.get(code);
  return country ? ok(country) : notFound("País no encontrado");
}
