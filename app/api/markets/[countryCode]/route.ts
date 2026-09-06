import { badRequest, ok } from "@/lib/api/http";
import { marketService } from "@/lib/market/market-service";

export async function GET(_req: Request, { params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params;
  try {
    return ok(marketService.get(countryCode));
  } catch {
    return badRequest("País no soportado");
  }
}
