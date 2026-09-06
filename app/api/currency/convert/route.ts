import { badRequest, ok, parseBody } from "@/lib/api/http";
import { currencyConvertSchema } from "@/lib/validations/market";
import { currencyService } from "@/lib/market/currency-service";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, currencyConvertSchema);
    const result = currencyService.convert(
      { amount: body.amount, currency: body.from as never },
      body.to as never,
    );
    return ok({ ...result, reference: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return badRequest("No se pudo convertir");
  }
}
