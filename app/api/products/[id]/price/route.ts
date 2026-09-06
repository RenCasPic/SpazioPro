import { notFound, ok } from "@/lib/api/http";
import { catalogService } from "@/lib/market/catalog-service";
import { pricingService } from "@/lib/market/pricing-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = new URL(request.url).searchParams.get("state");
  if (!catalogService.get(id)) return notFound("Product not found");
  return ok(pricingService.resolve(id, state ? state.toUpperCase() : null));
}
