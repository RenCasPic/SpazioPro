import { jsPDF } from "jspdf";
import type { Client, Estimate, Profile, Project, ProjectImage } from "@/types";
import { PROJECT_TYPE_LABELS } from "@/types";
import { APP_NAME, APP_TAGLINE, PRICE_DISCLAIMER, UNIT_LABELS } from "@/lib/constants";
import { countryByCode } from "@/lib/market/data/countries";
import { currencyService } from "@/lib/market/currency-service";
import { formatDateLong } from "@/lib/format";

const INK: [number, number, number] = [28, 25, 23];
const CLAY: [number, number, number] = [180, 83, 42];
const SOFT: [number, number, number] = [120, 113, 108];

export interface PdfPayload {
  estimate: Estimate;
  project: Project;
  client: Client | null;
  profile: Profile | null;
  originalImage: ProjectImage | null;
}

interface PdfImages {
  originalPng?: string;
  designPng?: string;
}

/** Pure jsPDF document builder — safe on the server (no DOM). */
export function buildEstimatePdf(payload: PdfPayload, images: PdfImages = {}): Blob {
  const { estimate, project, client, profile } = payload;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 16;
  let y = 0;

  const country = countryByCode(estimate.countryCode);
  const fmt = (n: number) =>
    currencyService.format({ amount: n, currency: estimate.currencyCode }, country?.locale);

  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(APP_NAME, M, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(212, 200, 190);
  doc.text(APP_TAGLINE, M, 17);
  doc.text(`Presupuesto ${estimate.estimateNumber}`, pageW - M, 11, { align: "right" });
  doc.text(formatDateLong(estimate.createdAt, country?.locale), pageW - M, 17, { align: "right" });

  y = 32;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(profile?.companyName || profile?.fullName || "Profesional", M, y);
  doc.text("Cliente", pageW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SOFT);
  col(doc, M, y + 5, [profile?.fullName, profile?.city, profile?.phone, profile?.email, profile?.taxId]);
  col(doc, pageW / 2, y + 5, [client?.name, client?.company, client?.city, client?.phone, client?.email]);

  y += 34;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(project.name, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.text(
    `${PROJECT_TYPE_LABELS[project.projectType]} · ${country?.name ?? project.countryCode} · ${estimate.currencyCode}`,
    M,
    y,
  );
  y += 8;

  if (images.originalPng || images.designPng) {
    const imgW = (pageW - M * 2 - 6) / 2;
    const imgH = imgW * 0.7;
    try {
      if (images.originalPng) doc.addImage(images.originalPng, "PNG", M, y, imgW, imgH);
      if (images.designPng) doc.addImage(images.designPng, "PNG", M + imgW + 6, y, imgW, imgH);
      doc.setFontSize(7.5);
      doc.setTextColor(...SOFT);
      doc.text("Estado actual", M + 1, y + imgH + 4);
      doc.text("Propuesta de diseño", M + imgW + 7, y + imgH + 4);
      y += imgH + 10;
    } catch {
      /* ignore */
    }
  }

  y = sectionTitle(doc, "Materiales, mobiliario y mano de obra", M, y, pageW);
  y = tableHead(doc, M, y, pageW);
  for (const it of estimate.items) {
    if (y > pageH - 46) {
      doc.addPage();
      y = M;
      y = tableHead(doc, M, y, pageW);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(it.description, pageW - M * 2 - 74)[0] as string, M, y);
    doc.setTextColor(...SOFT);
    doc.setFontSize(7.5);
    doc.text(`${num2(it.quantity)} ${UNIT_LABELS[it.unit]}`, pageW - M - 60, y, { align: "right" });
    doc.text(fmt(it.unitPrice + it.laborPrice), pageW - M - 28, y, { align: "right" });
    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    doc.text(fmt(it.total), pageW - M, y, { align: "right" });
    if (it.priceSnapshot.source === "converted") {
      doc.setTextColor(...CLAY);
      doc.setFontSize(6.5);
      doc.text("precio de referencia (conversión de divisa)", M, y + 3.4);
      y += 8;
    } else {
      y += 6;
    }
  }

  if (y > pageH - 78) {
    doc.addPage();
    y = M;
  }
  y += 4;
  const bx = pageW - M - 82;
  doc.setDrawColor(220, 214, 205);
  doc.line(bx, y, pageW - M, y);
  y += 6;
  y = totalRow(doc, "Materiales", fmt(estimate.subtotalMaterials), bx, y, pageW, M);
  y = totalRow(doc, "Mano de obra", fmt(estimate.subtotalLabor), bx, y, pageW, M);
  y = totalRow(doc, "Transporte", fmt(estimate.subtotalTransport), bx, y, pageW, M);
  if (estimate.discount > 0) y = totalRow(doc, "Descuento", `-${fmt(estimate.discount)}`, bx, y, pageW, M);
  y = totalRow(doc, `${taxLabel(estimate.countryCode)} ${num2(estimate.taxRate)}%`, fmt(estimate.taxAmount), bx, y, pageW, M);
  doc.setDrawColor(...CLAY);
  doc.setLineWidth(0.5);
  doc.line(bx, y, pageW - M, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...CLAY);
  doc.text("TOTAL", bx, y);
  doc.text(fmt(estimate.total), pageW - M, y, { align: "right" });
  y += 12;

  if (estimate.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("Notas", M, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SOFT);
    const lines = doc.splitTextToSize(estimate.notes, pageW - M * 2) as string[];
    doc.text(lines, M, y);
    y += lines.length * 4 + 3;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Condiciones", M, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...SOFT);
  for (const c of [PRICE_DISCLAIMER, profile?.terms || "Presupuesto válido durante 30 días desde la fecha de emisión."]) {
    const lines = doc.splitTextToSize(`• ${c}`, pageW - M * 2) as string[];
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 1.5;
  }

  doc.setFontSize(7);
  doc.setTextColor(...SOFT);
  doc.text(`${APP_NAME} · ${APP_TAGLINE}`, M, pageH - 8);

  return doc.output("blob");
}

/** Client wrapper — bakes the photo + design preview then builds the PDF. */
export const pdfService = {
  async generate(payload: PdfPayload): Promise<Blob> {
    const images: PdfImages = {};
    const src = payload.originalImage?.originalUrl;
    if (src) {
      images.originalPng = await bake(src);
      images.designPng = await bake(src, payload.originalImage?.designFilter);
    }
    return buildEstimatePdf(payload, images);
  },
};

async function bake(dataUrl: string, filter?: string): Promise<string | undefined> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#faf8f5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (filter) ctx.filter = filter;
    const ratio = Math.min(canvas.width / (img.naturalWidth || 1000), canvas.height / (img.naturalHeight || 700));
    const w = (img.naturalWidth || 1000) * ratio;
    const h = (img.naturalHeight || 700) * ratio;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

function col(doc: jsPDF, x: number, y: number, items: (string | undefined | null)[]) {
  let cy = y;
  for (const item of items.filter(Boolean) as string[]) {
    doc.text(item, x, cy);
    cy += 4;
  }
}
function sectionTitle(doc: jsPDF, title: string, x: number, y: number, pageW: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(title, x, y);
  doc.setDrawColor(230, 226, 218);
  doc.line(x, y + 2, pageW - x, y + 2);
  return y + 8;
}
function tableHead(doc: jsPDF, x: number, y: number, pageW: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT);
  doc.text("CONCEPTO", x, y);
  doc.text("CANTIDAD", pageW - x - 60, y, { align: "right" });
  doc.text("PRECIO", pageW - x - 28, y, { align: "right" });
  doc.text("TOTAL", pageW - x, y, { align: "right" });
  return y + 5;
}
function totalRow(doc: jsPDF, label: string, value: string, x: number, y: number, pageW: number, m: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.text(label, x, y);
  doc.setTextColor(...INK);
  doc.text(value, pageW - m, y, { align: "right" });
  return y + 5.5;
}
function taxLabel(code: string): string {
  return code === "US" ? "Sales Tax" : code === "GB" ? "VAT" : "IVA";
}
function num2(n: number): string {
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
