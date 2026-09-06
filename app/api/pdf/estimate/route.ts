import { badRequest } from "@/lib/api/http";
import { buildEstimatePdf, type PdfPayload } from "@/lib/services/pdf-service";

/** Builds the estimate/proposal PDF server-side (bilingual). */
export async function POST(request: Request) {
  let payload: PdfPayload;
  try {
    payload = (await request.json()) as PdfPayload;
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (!payload?.estimate?.estimateNumber || !payload?.project?.name) {
    return badRequest("Missing estimate data");
  }
  try {
    const blob = buildEstimatePdf(payload);
    const kind = payload.estimate.kind === "proposal" ? "Proposal" : "Estimate";
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${kind}-${payload.estimate.estimateNumber}.pdf"`,
      },
    });
  } catch {
    return badRequest("PDF generation failed");
  }
}
