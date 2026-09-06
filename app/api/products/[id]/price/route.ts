import { badRequest, notFound, ok } from "@/lib/api/http";
import { catalogService } from "@/lib/market/catalog-service";
import { pricingService } from "@/lib/market/pricing-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const country = new URL(request.url).searchParams.get("country");
  if (!country) return badRequest("Falta el parámetro ?country=");
  if (!catalogService.get(id)) return notFound("Producto no encontrado");
  try {
    return ok(pricingService.resolve(id, country));
  } catch {
    return badRequest("País no soportado");
  }
}
