import { badRequest, ok, parseQuery } from "@/lib/api/http";
import { catalogQuerySchema } from "@/lib/validations/product";
import { catalogService } from "@/lib/market/catalog-service";

export function GET(request: Request) {
  try {
    const q = parseQuery(request, catalogQuerySchema);
    return ok(
      catalogService.search({
        countryCode: q.country,
        group: q.group as never,
        category: q.category as never,
        query: q.q,
        brand: q.brand,
        style: q.style,
        maxPrice: q.maxPrice,
        availableOnly: q.availableOnly,
      }),
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("Petición no válida");
  }
}
