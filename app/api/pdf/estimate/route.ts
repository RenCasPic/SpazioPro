import { badRequest } from "@/lib/api/http";
import { buildEstimatePdf, type PdfPayload } from "@/lib/services/pdf-service";

/**
 * Builds the estimate PDF server-side (text, tables, totals, conditions).
 * The client route bakes the before/after images and can also build locally.
 */
export async function POST(request: Request) {
  let payload: PdfPayload;
  try {
    payload = (await request.json()) as PdfPayload;
  } catch {
    return badRequest("Cuerpo JSON no válido");
  }
  if (!payload?.estimate?.estimateNumber || !payload?.project?.name) {
    return badRequest("Faltan datos del presupuesto");
  }

  try {
    const blob = buildEstimatePdf(payload);
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Presupuesto-${payload.estimate.estimateNumber}.pdf"`,
      },
    });
  } catch {
    return badRequest("No se pudo generar el PDF");
  }
}
