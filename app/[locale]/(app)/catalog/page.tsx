"use client";

import { useMemo, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useCatalog, useCatalogFacets } from "@/hooks/use-products";
import { StateSelect } from "@/components/countries/state-select";
import { EmptyState } from "@/components/ui/states";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { CATEGORIES, GROUP_LABELS_EN, GROUP_LABELS_ES, GROUP_ORDER } from "@/data/categories";
import { UNIT_KEYS } from "@/lib/constants";
import { formatUsd } from "@/lib/format";
import type { ProductGroup } from "@/types";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const t = useT();
  const locale = useLocale();
  const { profile } = useSession();
  const [state, setState] = useState(profile?.defaultStateCode ?? "TX");
  const [group, setGroup] = useState<ProductGroup | "all">("all");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");

  const facets = useCatalogFacets(state);
  const entries = useCatalog(
    useMemo(
      () => ({ stateCode: state, group: group === "all" ? undefined : group, category: (category as never) ?? undefined, query: query || undefined, brand: brand || undefined }),
      [state, group, category, query, brand],
    ),
  );
  const groupLabel = (g: ProductGroup) => (locale === "es-US" ? GROUP_LABELS_ES : GROUP_LABELS_EN)[g];
  const cats = group === "all" ? [] : CATEGORIES.filter((c) => c.group === group);

  const SRC: Record<string, string> = {
    market: t("catalog.price_source.market"),
    supplier: t("catalog.price_source.supplier"),
    converted: t("catalog.price_source.converted"),
    missing: t("catalog.price_source.missing"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[28px] text-ink">{t("catalog.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("catalog.subtitle")}</p>
        </div>
        <div className="w-56">
          <StateSelect value={state} onChange={setState} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3">
          <Search className="h-4 w-4 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("catalog.search_placeholder")} className="w-56 bg-transparent text-sm outline-none placeholder:text-muted" />
        </div>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm">
          <option value="">{t("catalog.all_brands")}</option>
          {facets.brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <Chip active={group === "all" && !category} onClick={() => { setGroup("all"); setCategory(null); }}>
          {t("catalog.all")}
        </Chip>
        {GROUP_ORDER.map((g) => (
          <Chip key={g} active={group === g && !category} onClick={() => { setGroup(g); setCategory(null); }}>
            {groupLabel(g)}
          </Chip>
        ))}
      </div>
      {group !== "all" && (
        <div className="no-scrollbar -mt-3 flex gap-1.5 overflow-x-auto">
          {cats.map((c) => (
            <Chip key={c.key} small active={category === c.key} onClick={() => setCategory(category === c.key ? null : c.key)}>
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState title={t("catalog.no_results")} description={t("catalog.no_results_hint")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ product, price }) => (
            <div key={product.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative h-36" style={{ background: product.swatch }}>
                {product.sprite && <span className="grid h-full w-full place-items-center text-5xl">{product.sprite}</span>}
                <span className={cn("absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium", price.source === "converted" || price.source === "missing" ? "bg-gold/20 text-gold" : "bg-white/85 text-sage")}>
                  {SRC[price.source]}
                </span>
              </div>
              <div className="p-3.5">
                <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                <p className="truncate text-[11px] text-muted">{product.brand} · {product.sku}</p>
                <p className="mt-1 text-[11px] text-ink-soft">{product.style} · {product.color}</p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="font-serif text-lg text-ink">
                    {formatUsd(price.money.amount, locale)}
                    <span className="text-[11px] font-sans text-muted"> /{t(UNIT_KEYS[product.unit])}</span>
                  </span>
                  {!price.available && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-red-600">
                      <AlertTriangle className="h-3 w-3" /> {t("catalog.no_stock")}
                    </span>
                  )}
                </div>
                {price.supplier && <p className="mt-1 text-[11px] text-muted">{t("catalog.supplier", { name: price.supplier })}</p>}
                {price.available && <p className="text-[11px] text-muted">{t("catalog.lead_time", { days: price.leadTimeDays })}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <PriceDisclaimer />
    </div>
  );
}

function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border font-medium transition-colors",
        small ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        active ? "border-clay bg-clay-tint text-clay-dark" : "border-line-strong text-ink-soft hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}
