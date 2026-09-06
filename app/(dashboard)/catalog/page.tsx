"use client";

import { useMemo, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useCatalog, useCatalogFacets } from "@/hooks/use-products";
import { CountrySelect } from "@/components/countries/country-select";
import { EmptyState } from "@/components/ui/states";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { CATEGORIES, GROUP_LABELS, GROUP_ORDER } from "@/data/categories";
import { currencyService } from "@/lib/market/currency-service";
import { UNIT_LABELS } from "@/lib/constants";
import type { ProductGroup } from "@/types";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, string> = {
  market: "Precio local",
  supplier: "Proveedor local",
  converted: "Conversión de referencia",
  missing: "Sin precio",
};

export default function CatalogPage() {
  const { profile } = useSession();
  const [country, setCountry] = useState(profile?.countryCode ?? "ES");
  const [group, setGroup] = useState<ProductGroup | "all">("all");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [style, setStyle] = useState("");

  const facets = useCatalogFacets(country);
  const entries = useCatalog(
    useMemo(
      () => ({
        countryCode: country,
        group: group === "all" ? undefined : group,
        category: (category as never) ?? undefined,
        query: query || undefined,
        brand: brand || undefined,
        style: style || undefined,
      }),
      [country, group, category, query, brand, style],
    ),
  );

  const cats = group === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.group === group);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">Catálogo</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Precios por mercado. Un mismo producto puede costar diferente en cada país.
          </p>
        </div>
        <div className="w-56">
          <CountrySelect value={country} onChange={setCountry} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto, marca, referencia…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm">
          <option value="">Todas las marcas</option>
          {facets.brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm">
          <option value="">Cualquier estilo</option>
          {facets.styles.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <Chip active={group === "all" && !category} onClick={() => { setGroup("all"); setCategory(null); }}>
          Todo
        </Chip>
        {GROUP_ORDER.map((g) => (
          <Chip key={g} active={group === g && !category} onClick={() => { setGroup(g); setCategory(null); }}>
            {GROUP_LABELS[g]}
          </Chip>
        ))}
      </div>
      {group !== "all" && (
        <div className="no-scrollbar -mt-3 flex gap-1.5 overflow-x-auto">
          {cats.map((c) => (
            <Chip key={c.key} active={category === c.key} onClick={() => setCategory(category === c.key ? null : c.key)} small>
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otros filtros o cambia de mercado." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ product, price }) => (
            <div key={product.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative h-36" style={{ background: product.swatch }}>
                {product.sprite && <span className="grid h-full w-full place-items-center text-5xl">{product.sprite}</span>}
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    price.source === "converted" || price.source === "missing" ? "bg-gold/20 text-gold" : "bg-white/85 text-sage",
                  )}
                >
                  {SOURCE_LABEL[price.source]}
                </span>
              </div>
              <div className="p-3.5">
                <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {product.brand} · {product.sku}
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">{product.style} · {product.color}</p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="font-serif text-lg text-ink">
                    {currencyService.format(price.money)}
                    <span className="text-[11px] font-sans text-muted"> /{UNIT_LABELS[product.unit]}</span>
                  </span>
                  {!price.available && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-red-600">
                      <AlertTriangle className="h-3 w-3" /> sin stock
                    </span>
                  )}
                </div>
                {price.supplier && <p className="mt-1 text-[11px] text-muted">Proveedor: {price.supplier}</p>}
                {price.convertedFrom && (
                  <p className="mt-1 text-[10px] text-gold">
                    Ref. {currencyService.format(price.convertedFrom)} · sin precio local
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PriceDisclaimer />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
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
