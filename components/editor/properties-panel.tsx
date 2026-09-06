"use client";

import Link from "next/link";
import { Package, Trash2, FileText } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { DimensionsForm } from "./dimensions-form";
import { ItemInspector } from "./item-inspector";
import { itemBreakdown, resolveItemQuantity, calculateEstimate } from "@/lib/calculations/estimate";
import { transportService } from "@/lib/market/transport-service";
import { currencyService } from "@/lib/market/currency-service";
import { UNIT_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { productById } from "@/data/catalog";
import { PriceDisclaimer } from "@/components/ui/disclaimer";

export function PropertiesPanel({ bundle }: { bundle: ProjectBundle }) {
  const { selectedItemId, select, removeItem } = useEditor();
  const items = activeItems(bundle);
  const selected = items.find((i) => i.id === selectedItemId) ?? null;
  const room = bundle.rooms[0];
  const dims = room ? { width: room.width, length: room.length, height: room.height } : { width: 4, length: 5, height: 2.6 };

  const totals = calculateEstimate({
    items,
    dimensions: dims,
    measurementSource: room?.measurementSource ?? "ai_estimate",
    laborLines: bundle.config.laborLines,
    transportRate: transportService.rateForCountry(bundle.project.countryCode),
    settings: bundle.config.settings,
    currency: bundle.project.currencyCode,
  }).totals;

  const money = (n: number) =>
    currencyService.format({ amount: n, currency: bundle.project.currencyCode }, bundle.project.locale);

  if (selected) {
    return (
      <div className="p-4">
        <button onClick={() => select(null)} className="mb-3 text-xs font-medium text-clay hover:text-clay-dark">
          ← Volver al resumen
        </button>
        <ItemInspector item={selected} bundle={bundle} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <DimensionsForm bundle={bundle} />

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink">Elementos</h3>
          <span className="text-xs text-muted">{items.length}</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {items.length === 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-4 text-sm text-muted">
              <Package className="h-4 w-4" /> Aún no has añadido materiales ni mobiliario.
            </p>
          )}
          {items.map((it) => {
            const p = productById(it.productId);
            const b = itemBreakdown(it, dims);
            return (
              <div key={it.id} className="group flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 hover:border-ink/20">
                <button onClick={() => select(it.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-lg" style={{ background: p?.swatch }}>
                    {p?.sprite ?? ""}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{it.name}</span>
                    <span className="block text-[11px] text-muted">
                      {formatNumber(resolveItemQuantity(it, dims))} {UNIT_LABELS[it.unit]} · {money(b.total)}
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

      <div className="rounded-xl border border-line p-3 text-sm">
        <Row label="Materiales" value={money(totals.materials)} />
        <Row label="Mano de obra" value={money(totals.labor)} />
        <Row label="Transporte" value={money(totals.transport)} />
        <Row label={`IVA ${bundle.config.settings.vatRate}%`} value={money(totals.tax)} />
        <div className="mt-1 flex justify-between border-t border-line pt-1.5 font-serif text-base">
          <span>Total estimado</span>
          <span className="tabular-nums">{money(totals.total)}</span>
        </div>
        <Link
          href={`/projects/${bundle.project.id}/budget`}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-ink text-[13px] font-medium text-white hover:bg-ink/90"
        >
          <FileText className="h-4 w-4" /> Ver presupuesto
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
