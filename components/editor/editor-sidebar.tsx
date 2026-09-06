"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, PaintBucket, ChefHat, Bath, Sofa, Lightbulb, Search, SlidersHorizontal, Plus, Wand2, AlertTriangle } from "lucide-react";
import type { ProductGroup } from "@/types";
import { CATEGORIES, GROUP_LABELS_EN, GROUP_LABELS_ES, GROUP_ORDER, categoryMeta } from "@/data/categories";
import { SURFACE_KEYS, UNIT_KEYS } from "@/lib/constants";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { useCatalog, useCatalogFacets } from "@/hooks/use-products";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<ProductGroup, typeof Sofa> = {
  flooring: LayoutGrid,
  walls: PaintBucket,
  kitchen: ChefHat,
  bathroom: Bath,
  furniture: Sofa,
  lighting: Lightbulb,
};

export function EditorSidebar({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { addProduct, activeSurface, setActiveSurface, applying } = useEditor();
  const push = useToasts((s) => s.push);
  const state = bundle.project.stateCode;

  const [group, setGroup] = useState<ProductGroup>("flooring");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [style, setStyle] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const facets = useCatalogFacets(state);
  const entries = useCatalog(
    useMemo(
      () => ({
        stateCode: state,
        group,
        category: (category as never) ?? undefined,
        query: query || undefined,
        brand: brand || undefined,
        style: style || undefined,
        maxPrice: maxPrice ?? undefined,
      }),
      [state, group, category, query, brand, style, maxPrice],
    ),
  );
  const groupLabel = (g: ProductGroup) => (locale === "es-US" ? GROUP_LABELS_ES : GROUP_LABELS_EN)[g];
  const groupCategories = CATEGORIES.filter((c) => c.group === group);

  const SOURCE_LABEL: Record<string, string> = {
    market: t("editor.price_source.market"),
    supplier: t("editor.price_source.supplier"),
    converted: t("editor.price_source.converted"),
    missing: t("editor.price_source.missing"),
  };

  async function apply(entry: (typeof entries)[number]) {
    const meta = categoryMeta(entry.product.category);
    if (meta.kind === "surface") {
      await addProduct(entry.product, activeSurface ?? meta.surface);
      push(t("editor.material_applied", { name: entry.product.name }), "success");
    } else {
      await addProduct(entry.product);
      push(t("editor.material_added", { name: entry.product.name }), "success");
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line bg-surface py-3">
        {GROUP_ORDER.map((g) => {
          const Icon = GROUP_ICON[g];
          return (
            <button
              key={g}
              onClick={() => {
                setGroup(g);
                setCategory(null);
              }}
              title={groupLabel(g)}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl transition-colors",
                group === g ? "bg-clay text-white" : "text-ink-soft hover:bg-ink/5",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="border-b border-line px-4 pb-3 pt-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">{groupLabel(group)}</h2>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs", showFilters ? "border-clay text-clay" : "border-line-strong text-ink-soft")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> {t("editor.filters")}
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line-strong px-3">
            <Search className="h-4 w-4 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("editor.search_placeholder")} className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              {t("editor.all")}
            </Chip>
            {groupCategories.map((c) => (
              <Chip key={c.key} active={category === c.key} onClick={() => setCategory(category === c.key ? null : c.key)}>
                {c.label}
              </Chip>
            ))}
          </div>

          {showFilters && (
            <div className="mt-3 space-y-2.5 rounded-xl bg-paper p-3">
              <div className="grid grid-cols-2 gap-2">
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs">
                  <option value="">{t("catalog.all_brands")}</option>
                  {facets.brands.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs">
                  <option value="">{t("catalog.any_style")}</option>
                  {facets.styles.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <input
                type="range"
                min={Math.floor(facets.priceRange[0])}
                max={Math.ceil(facets.priceRange[1])}
                value={maxPrice ?? Math.ceil(facets.priceRange[1])}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxPrice(v >= Math.ceil(facets.priceRange[1]) ? null : v);
                }}
                className="w-full"
              />
              <p className="text-right text-[11px] text-muted">{maxPrice ? `≤ ${formatUsd(maxPrice, locale)}` : "—"}</p>
            </div>
          )}

          {activeSurface && (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-clay-tint px-2.5 py-1.5 text-[11px] text-clay-dark">
              <Wand2 className="h-3.5 w-3.5" />
              {t("editor.active_zone", { zone: t(SURFACE_KEYS[activeSurface]) })}
              <button className="ml-auto underline" onClick={() => setActiveSurface(null)}>
                {t("editor.remove")}
              </button>
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid gap-2.5">
            {entries.map((entry) => {
              const { product, price } = entry;
              const isSurface = categoryMeta(product.category).kind === "surface";
              return (
                <div key={product.id} className="flex gap-3 rounded-xl border border-line p-2.5 hover:border-ink/20">
                  <div className="h-16 w-16 shrink-0 rounded-lg border border-line" style={{ background: product.swatch }}>
                    {product.sprite && <span className="grid h-full w-full place-items-center text-2xl">{product.sprite}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="truncate text-[11px] text-muted">{product.brand} · {product.sku}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                      <span className={cn("rounded px-1 py-px", price.source === "converted" || price.source === "missing" ? "bg-gold/15 text-gold" : "bg-sage/15 text-sage")}>
                        {SOURCE_LABEL[price.source]}
                      </span>
                      {!price.available ? (
                        <span className="inline-flex items-center gap-0.5 text-red-600">
                          <AlertTriangle className="h-3 w-3" /> {t("editor.no_stock")}
                        </span>
                      ) : (
                        <span className="text-muted">{t("editor.lead_time", { days: price.leadTimeDays })}</span>
                      )}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">
                        {formatUsd(price.money.amount, locale)}
                        <span className="text-[11px] font-normal text-muted"> /{t(UNIT_KEYS[product.unit])}</span>
                      </span>
                      <button
                        onClick={() => apply(entry)}
                        disabled={applying === product.id}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-[12px] font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                      >
                        {applying === product.id ? (
                          t("editor.applying")
                        ) : isSurface ? (
                          <>
                            <Wand2 className="h-3 w-3" /> {t("common.actions.apply")}
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" /> {t("common.actions.add")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && <p className="py-10 text-center text-sm text-muted">{t("catalog.no_results")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("shrink-0 rounded-full border px-3 py-1 text-xs transition-colors", active ? "border-clay bg-clay-tint text-clay-dark" : "border-line-strong text-ink-soft hover:border-ink/30")}
    >
      {children}
    </button>
  );
}
