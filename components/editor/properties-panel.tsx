"use client";

import { Package, Trash2, FileText } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { LocaleLink } from "@/components/localization/locale-link";
import { DimensionsForm } from "./dimensions-form";
import { ItemInspector } from "./item-inspector";
import { itemBreakdown, resolveItemQuantity, calculateEstimate } from "@/lib/calculations/estimate";
import { taxService } from "@/lib/market/tax-service";
import { UNIT_KEYS } from "@/lib/constants";
import { formatUsd, formatNumber } from "@/lib/format";
import { productById } from "@/data/catalog";
import { PriceDisclaimer } from "@/components/ui/disclaimer";

export function PropertiesPanel({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { selectedItemId, select, removeItem } = useEditor();
  const items = activeItems(bundle);
  const selected = items.find((i) => i.id === selectedItemId) ?? null;
  const room = bundle.rooms[0];
  const dims = room ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn } : { widthIn: 144, lengthIn: 180, heightIn: 108 };
  const loc = bundle.location;
  const tax = loc ? taxService.getTaxRate({ stateCode: loc.stateCode, city: loc.city, zipCode: loc.zipCode }) : null;

  const totals = calculateEstimate({
    items,
    dimensions: dims,
    measurementSource: room?.measurementSource ?? "ai_estimate",
    laborLines: bundle.config.laborLines,
    settings: bundle.config.settings,
    currency: "USD",
    hasTaxJurisdiction: (tax?.matchedOn ?? "none") !== "none",
  }).totals;
  const money = (n: number) => formatUsd(n, locale);

  if (selected) {
    return (
      <div className="p-4">
        <button onClick={() => select(null)} className="mb-3 text-xs font-medium text-clay hover:text-clay-dark">
          {t("editor.back_to_summary")}
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
          <h3 className="font-serif text-lg text-ink">{t("editor.elements")}</h3>
          <span className="text-xs text-muted">{items.length}</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {items.length === 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-4 text-sm text-muted">
              <Package className="h-4 w-4" /> {t("editor.no_elements")}
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
                      {formatNumber(resolveItemQuantity(it, dims), 2, locale)} {t(UNIT_KEYS[it.unit])} · {money(b.total)}
                    </span>
                  </span>
                </button>
                <button onClick={() => removeItem(it.id)} className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line p-3 text-sm">
        <Row label={t("estimates.cost_lines.materials")} value={money(totals.materials)} />
        <Row label={t("estimates.cost_lines.labor")} value={money(totals.labor)} />
        <Row label={`${t("estimates.cost_lines.sales_tax")} ${bundle.config.settings.salesTaxRate}%`} value={money(totals.tax)} />
        <div className="mt-1 flex justify-between border-t border-line pt-1.5 font-serif text-base">
          <span>{t("editor.total_estimate")}</span>
          <span className="tabular-nums">{money(totals.total)}</span>
        </div>
        <LocaleLink
          href={`/projects/${bundle.project.id}/estimate`}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-ink text-[13px] font-medium text-white hover:bg-ink/90"
        >
          <FileText className="h-4 w-4" /> {t("editor.view_estimate")}
        </LocaleLink>
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
