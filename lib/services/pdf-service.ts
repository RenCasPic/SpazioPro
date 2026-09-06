import { jsPDF } from "jspdf";
import type { Client, Estimate, Profile, Project, ProjectImage, ProjectLocation } from "@/types";
import { UNIT_LABELS_EN, UNIT_LABELS_ES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createTranslator } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import { stateService } from "@/lib/market/country-service";

const INK: [number, number, number] = [28, 25, 23];
const CLAY: [number, number, number] = [180, 83, 42];
const SOFT: [number, number, number] = [120, 113, 108];

export interface PdfPayload {
  estimate: Estimate;
  project: Project;
  client: Client | null;
  profile: Profile | null;
  location: ProjectLocation | null;
  originalImage: ProjectImage | null;
}

interface PdfImages {
  originalPng?: string;
  designPng?: string;
}

/** Pure jsPDF document builder — safe on the server (no DOM). Bilingual. */
export function buildEstimatePdf(payload: PdfPayload, images: PdfImages = {}): Blob {
  const { estimate, project, client, profile, location } = payload;
  const lang: Locale = estimate.language ?? "en-US";
  const t = createTranslator(getDictionary(lang));
  const unitLabel = lang === "es-US" ? UNIT_LABELS_ES : UNIT_LABELS_EN;
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  const money = (n: number) =>
    new Intl.NumberFormat(lang, { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 16;
  let y = 0;
  const isProposal = estimate.kind === "proposal";

  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SPAZIOPRO", M, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(212, 200, 190);
  doc.text(isProposal ? t("pdf.proposal_title") : t("pdf.estimate_title"), M, 18);
  const numberLabel = isProposal
    ? t("pdf.proposal_number", { number: estimate.estimateNumber })
    : t("pdf.estimate_number", { number: estimate.estimateNumber });
  doc.text(numberLabel, pageW - M, 11, { align: "right" });
  doc.text(
    `${t("pdf.date")}: ${new Date(estimate.createdAt).toLocaleDateString(lang, { month: "long", day: "numeric", year: "numeric" })}`,
    pageW - M,
    18,
    { align: "right" },
  );

  y = 32;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t("pdf.prepared_by"), M, y);
  doc.text(t("pdf.client"), pageW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SOFT);
  col(doc, M, y + 5, [
    profile?.companyName,
    profile?.fullName,
    profile?.licenseNumber ? `Lic. ${profile.licenseNumber}` : null,
    profile?.phone,
    profile?.email,
  ]);
  col(doc, pageW / 2, y + 5, [client?.name, client?.company, client?.email, client?.phone]);

  y += 30;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(project.name, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  const addr = location
    ? `${location.address}, ${location.city}, ${stateService.get(location.stateCode)?.name ?? location.stateCode} ${location.zipCode}`
    : `${estimate.city}, ${estimate.stateCode} ${estimate.zipCode}`;
  doc.text(`${t("pdf.property_address")}: ${addr}`, M, y);
  y += 8;

  if (images.originalPng || images.designPng) {
    const imgW = (pageW - M * 2 - 6) / 2;
    const imgH = imgW * 0.66;
    try {
      if (images.originalPng) doc.addImage(images.originalPng, "PNG", M, y, imgW, imgH);
      if (images.designPng) doc.addImage(images.designPng, "PNG", M + imgW + 6, y, imgW, imgH);
      y += imgH + 8;
    } catch {
      /* ignore */
    }
  }

  if (estimate.scopeOfWork.trim()) {
    y = section(doc, t("pdf.scope_of_work"), M, y, pageW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SOFT);
    const lines = doc.splitTextToSize(estimate.scopeOfWork, pageW - M * 2) as string[];
    doc.text(lines, M, y);
    y += lines.length * 4 + 4;
  }

  y = section(doc, t("pdf.line_items"), M, y, pageW);
  y = tableHead(doc, M, y, pageW, t);
  for (const it of estimate.items) {
    if (y > pageH - 60) {
      doc.addPage();
      y = M;
      y = tableHead(doc, M, y, pageW, t);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(it.description, pageW - M * 2 - 74)[0] as string, M, y);
    doc.setTextColor(...SOFT);
    doc.setFontSize(7.5);
    doc.text(`${nf.format(it.quantity)} ${unitLabel[it.unit]}`, pageW - M - 58, y, { align: "right" });
    doc.text(money(it.unitPrice + it.laborPrice), pageW - M - 28, y, { align: "right" });
    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    doc.text(money(it.total), pageW - M, y, { align: "right" });
    if (it.priceSnapshot.source === "converted") {
      doc.setTextColor(...CLAY);
      doc.setFontSize(6.5);
      doc.text(t("pdf.reference_price_note"), M, y + 3.4);
      y += 8;
    } else {
      y += 6;
    }
  }

  if (y > pageH - 90) {
    doc.addPage();
    y = M;
  }
  y += 4;
  const bx = pageW - M - 82;
  doc.setDrawColor(220, 214, 205);
  doc.line(bx, y, pageW - M, y);
  y += 6;
  y = totalRow(doc, t("pdf.materials"), money(estimate.subtotalMaterials), bx, y, pageW, M);
  y = totalRow(doc, t("pdf.labor"), money(estimate.subtotalLabor), bx, y, pageW, M);
  if (estimate.subtotalEquipment > 0) y = totalRow(doc, t("pdf.equipment"), money(estimate.subtotalEquipment), bx, y, pageW, M);
  if (estimate.subtotalDelivery > 0) y = totalRow(doc, t("pdf.delivery"), money(estimate.subtotalDelivery), bx, y, pageW, M);
  if (estimate.subtotalDisposal > 0) y = totalRow(doc, t("pdf.disposal"), money(estimate.subtotalDisposal), bx, y, pageW, M);
  if (estimate.subtotalPermits > 0) y = totalRow(doc, t("pdf.permits"), money(estimate.subtotalPermits), bx, y, pageW, M);
  if (estimate.subtotalOther > 0) y = totalRow(doc, t("pdf.other"), money(estimate.subtotalOther), bx, y, pageW, M);
  const subtotal =
    estimate.subtotalMaterials +
    estimate.subtotalLabor +
    estimate.subtotalEquipment +
    estimate.subtotalDelivery +
    estimate.subtotalDisposal +
    estimate.subtotalPermits +
    estimate.subtotalOther;
  y = totalRow(doc, t("pdf.subtotal"), money(round2(subtotal)), bx, y, pageW, M);
  if (estimate.discount > 0) y = totalRow(doc, t("pdf.discount"), `-${money(estimate.discount)}`, bx, y, pageW, M);
  y = totalRow(doc, `${t("pdf.sales_tax")} ${nf.format(estimate.salesTaxRate)}%`, money(estimate.taxAmount), bx, y, pageW, M);
  doc.setDrawColor(...CLAY);
  doc.setLineWidth(0.5);
  doc.line(bx, y, pageW - M, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...CLAY);
  doc.text(t("pdf.grand_total"), bx, y);
  doc.text(money(estimate.total), pageW - M, y, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(t("pdf.terms"), M, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...SOFT);
  for (const c of [profile?.terms || t("pdf.default_terms"), t("common.disclaimer")]) {
    const lines = doc.splitTextToSize(`• ${c}`, pageW - M * 2) as string[];
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 1.5;
  }

  doc.setFontSize(7);
  doc.setTextColor(...SOFT);
  doc.text("SpazioPro · Visualize. Estimate. Build.", M, pageH - 8);

  return doc.output("blob");
}

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
    canvas.height = 660;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#faf8f5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (filter) ctx.filter = filter;
    const ratio = Math.min(canvas.width / (img.naturalWidth || 1000), canvas.height / (img.naturalHeight || 660));
    const w = (img.naturalWidth || 1000) * ratio;
    const h = (img.naturalHeight || 660) * ratio;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

type T = (k: string, v?: Record<string, string | number>) => string;

function col(doc: jsPDF, x: number, y: number, items: (string | undefined | null)[]) {
  let cy = y;
  for (const item of items.filter(Boolean) as string[]) {
    doc.text(item, x, cy);
    cy += 4;
  }
}
function section(doc: jsPDF, title: string, x: number, y: number, pageW: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(title, x, y);
  doc.setDrawColor(230, 226, 218);
  doc.line(x, y + 2, pageW - x, y + 2);
  return y + 8;
}
function tableHead(doc: jsPDF, x: number, y: number, pageW: number, t: T) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT);
  doc.text(t("pdf.concept").toUpperCase(), x, y);
  doc.text(t("pdf.quantity").toUpperCase(), pageW - x - 56, y, { align: "right" });
  doc.text(t("pdf.price").toUpperCase(), pageW - x - 28, y, { align: "right" });
  doc.text(t("pdf.total").toUpperCase(), pageW - x, y, { align: "right" });
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
function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
