import { jsPDF } from "jspdf";
import type { Project, ProjectItem } from "@/types";
import { UNIT_LABELS, ROOM_TYPE_LABELS } from "@/types";
import { itemQuantity, itemMaterialSubtotal, itemLaborSubtotal } from "@/lib/calc";
import { totalsForScenario, scenarioItems } from "@/lib/estimate";
import { formatCurrency, formatNumber, estimateNumber } from "@/lib/format";

const CLAY: [number, number, number] = [180, 83, 42];
const INK: [number, number, number] = [28, 25, 23];
const SOFT: [number, number, number] = [120, 113, 108];

async function bakeImage(dataUrl: string, filter?: string): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    const w = Math.min(1400, img.naturalWidth);
    const scale = w / img.naturalWidth;
    canvas.width = w;
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    if (filter) ctx.filter = filter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

export const pdfService = {
  async generate(project: Project, scenarioId = project.activeScenarioId): Promise<void> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    let y = margin;

    const scenario = project.scenarios.find((s) => s.id === scenarioId) ?? project.scenarios[0];
    const items = scenarioItems(project, scenarioId);
    const totals = totalsForScenario(project, scenarioId);
    const number = estimateNumber();
    const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

    // ---- header ----
    doc.setFillColor(...INK);
    doc.rect(0, 0, pageW, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(project.settings.companyName || "SpazioPro", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(210, 200, 190);
    doc.text(project.settings.companyTagline || "Reformas e interiorismo", margin, 18);
    doc.text(`Presupuesto ${number}`, pageW - margin, 12, { align: "right" });
    doc.text(today, pageW - margin, 18, { align: "right" });

    y = 36;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(project.name, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SOFT);
    doc.text(
      `${ROOM_TYPE_LABELS[project.roomType]} · Escenario ${scenario.name} · ${formatNumber(
        project.dimensions.width,
      )} × ${formatNumber(project.dimensions.length)} × ${formatNumber(project.dimensions.height)} m`,
      margin,
      y,
    );
    y += 8;

    // ---- images ----
    if (project.photo) {
      const imgW = (pageW - margin * 2 - 6) / 2;
      const imgH = imgW * 0.72;
      const original = await bakeImage(project.photo);
      const design = await bakeImage(project.photo, project.designFilter);
      try {
        doc.addImage(original, "JPEG", margin, y, imgW, imgH);
        doc.addImage(design, "JPEG", margin + imgW + 6, y, imgW, imgH);
        doc.setFontSize(8);
        doc.setTextColor(...SOFT);
        doc.text("Estado actual", margin + 1, y + imgH + 4);
        doc.text("Propuesta de diseño", margin + imgW + 7, y + imgH + 4);
        y += imgH + 10;
      } catch {
        /* ignore image errors */
      }
    }

    // ---- items table ----
    y = section(doc, "Materiales y mobiliario", margin, y, pageW);
    y = tableHeader(doc, margin, y, pageW);
    for (const it of items) {
      if (y > pageH - 40) {
        doc.addPage();
        y = margin;
        y = tableHeader(doc, margin, y, pageW);
      }
      y = itemRow(doc, it, project, margin, y, pageW);
    }

    // ---- labour ----
    const labor = project.labor.filter((l) => l.enabled);
    if (labor.length) {
      y += 4;
      y = section(doc, "Mano de obra adicional", margin, y, pageW);
      doc.setFontSize(9);
      for (const l of labor) {
        doc.setTextColor(...INK);
        doc.text(l.label, margin, y);
        doc.text(
          `${formatNumber(l.quantity)} ${UNIT_LABELS[l.unit]} × ${formatCurrency(l.price)}`,
          pageW - margin - 30,
          y,
          { align: "right" },
        );
        doc.text(formatCurrency(l.quantity * l.price), pageW - margin, y, { align: "right" });
        y += 5.5;
      }
    }

    // ---- totals ----
    if (y > pageH - 70) {
      doc.addPage();
      y = margin;
    }
    y += 6;
    const boxX = pageW - margin - 80;
    doc.setDrawColor(220, 214, 205);
    doc.line(boxX, y, pageW - margin, y);
    y += 6;
    y = totalRow(doc, "Materiales", totals.materials, boxX, y, pageW);
    y = totalRow(doc, "Mano de obra", totals.labor, boxX, y, pageW);
    y = totalRow(doc, "Transporte", totals.transport, boxX, y, pageW);
    if (totals.discount > 0) y = totalRow(doc, `Descuento ${project.settings.discountPct}%`, -totals.discount, boxX, y, pageW);
    y = totalRow(doc, "Base imponible", totals.taxable, boxX, y, pageW);
    y = totalRow(doc, `IVA ${project.settings.vatPct}%`, totals.vat, boxX, y, pageW);
    doc.setDrawColor(...CLAY);
    doc.setLineWidth(0.5);
    doc.line(boxX, y, pageW - margin, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...CLAY);
    doc.text("TOTAL", boxX, y);
    doc.text(formatCurrency(totals.total), pageW - margin, y, { align: "right" });
    y += 12;

    // ---- conditions ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("Condiciones", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SOFT);
    const conditions = [
      "Estimación orientativa. Los precios y cantidades pueden variar según proveedor, mediciones reales, condiciones del espacio y mano de obra.",
      "Presupuesto válido durante 30 días desde la fecha de emisión.",
      "No incluye licencias de obra ni tasas municipales salvo indicación expresa.",
      "Forma de pago: 40% a la aceptación, 40% a mitad de obra, 20% a la entrega.",
    ];
    for (const c of conditions) {
      const lines = doc.splitTextToSize(`• ${c}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 3.6 + 1;
    }

    doc.save(`Presupuesto-${project.name.replace(/\s+/g, "-")}-${number}.pdf`);
  },
};

function section(doc: jsPDF, title: string, x: number, y: number, pageW: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(title, x, y);
  doc.setDrawColor(230, 226, 218);
  doc.line(x, y + 2, pageW - x, y + 2);
  return y + 8;
}

function tableHeader(doc: jsPDF, x: number, y: number, pageW: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SOFT);
  doc.text("CONCEPTO", x, y);
  doc.text("CANTIDAD", pageW - x - 62, y, { align: "right" });
  doc.text("PRECIO", pageW - x - 30, y, { align: "right" });
  doc.text("TOTAL", pageW - x, y, { align: "right" });
  return y + 5;
}

function itemRow(
  doc: jsPDF,
  it: ProjectItem,
  project: Project,
  x: number,
  y: number,
  pageW: number,
): number {
  const qty = itemQuantity(it, project.dimensions);
  const total = itemMaterialSubtotal(it, project.dimensions) + itemLaborSubtotal(it, project.dimensions);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize(it.name, pageW - x * 2 - 70)[0], x, y);
  doc.setTextColor(...SOFT);
  doc.setFontSize(8);
  doc.text(`${formatNumber(qty)} ${UNIT_LABELS[it.unit]}`, pageW - x - 62, y, { align: "right" });
  doc.text(`${formatCurrency(it.unitPrice + it.laborPrice)}`, pageW - x - 30, y, { align: "right" });
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.text(formatCurrency(total), pageW - x, y, { align: "right" });
  return y + 6;
}

function totalRow(doc: jsPDF, label: string, value: number, x: number, y: number, pageW: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.text(label, x, y);
  doc.setTextColor(...INK);
  doc.text(formatCurrency(value), pageW - 16, y, { align: "right" });
  return y + 5.5;
}
