import { badRequest } from "@/lib/api/http";
import { buildEstimatePdf, type PdfPayload } from "@/lib/services/pdf-service";

/** Proposal = estimate document with kind forced to "proposal". */
export async function POST(request: Request) {
  let payload: PdfPayload;
  try {
    payload = (await request.json()) as PdfPayload;
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (!payload?.estimate?.estimateNumber || !payload?.project?.name) {
    return badRequest("Missing proposal data");
  }
  try {
    const blob = buildEstimatePdf({ ...payload, estimate: { ...payload.estimate, kind: "proposal" } });
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Proposal-${payload.estimate.estimateNumber}.pdf"`,
      },
    });
  } catch {
    return badRequest("PDF generation failed");
  }
}
