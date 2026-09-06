import { notFound, ok } from "@/lib/api/http";
import { catalogService } from "@/lib/market/catalog-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = catalogService.get(id);
  return product ? ok(product) : notFound("Product not found");
}
