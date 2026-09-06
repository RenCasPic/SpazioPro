"use client";

import type { PdfPayload } from "./pdf-service";
import { pdfService } from "./pdf-service";

/**
 * Generates the estimate PDF and prompts a download.
 * Tries the server route first (so the endpoint is exercised), then falls
 * back to client-side generation — which also bakes the design preview image.
 */
export async function downloadEstimatePdf(payload: PdfPayload): Promise<void> {
  let blob: Blob;
  try {
    const res = await fetch("/api/pdf/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("server");
    blob = await res.blob();
  } catch {
    blob = await pdfService.generate(payload);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Presupuesto-${payload.estimate.estimateNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
