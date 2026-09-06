"use client";

import Link from "next/link";
import { FileText, Trash2, Package } from "lucide-react";
import type { Project } from "@/types";
import { UNIT_LABELS } from "@/types";
import { useEditor, activeItems } from "@/lib/store";
import { DimensionsForm } from "./dimensions-form";
import { ItemInspector } from "./item-inspector";
import { itemQuantity, itemTotal } from "@/lib/calc";
import { activeTotals } from "@/lib/estimate";
import { formatCurrency, formatNumber } from "@/lib/format";
import { productById } from "@/data/catalog";
import { PriceDisclaimer } from "@/components/ui/disclaimer";

export function InspectorPanel({ project }: { project: Project }) {
  const { selectedItemId, select, removeItem } = useEditor();
  const items = activeItems(project);
  const selected = items.find((it) => it.id === selectedItemId) ?? null;
  const totals = activeTotals(project);

  if (selected) {
    return (
      <div className="p-4">
        <button
          onClick={() => select(null)}
          className="mb-3 text-xs font-medium text-clay hover:text-clay-dark"
        >
          ← Volver al resumen
        </button>
        <ItemInspector item={selected} project={project} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <DimensionsForm project={project} />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink">Elementos del diseño</h3>
          <span className="text-xs text-muted">{items.length}</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {items.length === 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-4 text-sm text-muted">
              <Package className="h-4 w-4" />
              Aún no has añadido materiales ni mobiliario.
            </p>
          )}
          {items.map((it) => {
            const p = productById(it.productId);
            return (
              <div
                key={it.id}
                className="group flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 hover:border-ink/20"
              >
                <button onClick={() => select(it.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-lg"
                    style={{ background: p?.swatch }}
                  >
                    {p?.sprite ?? ""}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{it.name}</span>
                    <span className="block text-[11px] text-muted">
                      {formatNumber(itemQuantity(it, project.dimensions))} {UNIT_LABELS[it.unit]} ·{" "}
                      {formatCurrency(itemTotal(it, project.dimensions))}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => removeItem(it.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line p-3">
        <div className="space-y-1 text-sm">
          <Row label="Materiales" value={formatCurrency(totals.materials)} />
          <Row label="Mano de obra" value={formatCurrency(totals.labor)} />
          <Row label="Transporte" value={formatCurrency(totals.transport)} />
          <Row label={`IVA ${project.settings.vatPct}%`} value={formatCurrency(totals.vat)} />
          <div className="flex justify-between border-t border-line pt-1.5 font-serif text-base">
            <span>Total estimado</span>
            <span className="tabular-nums">{formatCurrency(totals.total)}</span>
          </div>
        </div>
        <Link
          href={`/projects/${project.id}/budget`}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-ink text-[13px] font-medium text-white hover:bg-ink/90"
        >
          <FileText className="h-4 w-4" /> Ver presupuesto completo
        </Link>
      </div>

      <PriceDisclaimer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
