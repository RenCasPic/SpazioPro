"use client";

import { useMemo, useState } from "react";
import {
  Sofa,
  PaintBucket,
  ChefHat,
  Bath,
  Lightbulb,
  Flower2,
  Search,
  SlidersHorizontal,
  Plus,
  Wand2,
} from "lucide-react";
import type { Product, ProductGroup, SurfaceKind } from "@/types";
import { UNIT_LABELS } from "@/types";
import { CATEGORIES, GROUP_LABELS, GROUP_ORDER, categoryMeta } from "@/data/categories";
import { productService } from "@/services/productService";
import { imageGenerationService } from "@/services/imageGenerationService";
import { useEditor } from "@/lib/store";
import { useToasts } from "@/lib/toast";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<ProductGroup, typeof Sofa> = {
  materials: PaintBucket,
  furniture: Sofa,
  kitchen: ChefHat,
  bathroom: Bath,
  lighting: Lightbulb,
  decor: Flower2,
};

export function CatalogDock() {
  const { project, addProduct, mutate, activeSurface, setActiveSurface } = useEditor();
  const push = useToasts((s) => s.push);

  const [group, setGroup] = useState<ProductGroup>("materials");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [style, setStyle] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const [priceMin, priceMax] = productService.priceRange();
  const groupCategories = CATEGORIES.filter((c) => c.group === group);

  const results = useMemo(
    () =>
      productService.search({
        group,
        category: (category as Product["category"]) ?? undefined,
        query: query || undefined,
        brand: brand || undefined,
        style: style || undefined,
        maxPrice: maxPrice ?? undefined,
      }),
    [group, category, query, brand, style, maxPrice],
  );

  if (!project) return null;

  async function applySurface(product: Product) {
    if (!project) return;
    const meta = categoryMeta(product.category);
    const surface: SurfaceKind = activeSurface ?? meta.surface ?? "wall";
    setApplying(product.id);
    try {
      const res = await imageGenerationService.applyMaterial({
        image: project.photo ?? "",
        product,
        surface,
      });
      addProduct(product, surface);
      if (res.cssFilter || res.imageUrl) {
        mutate((d) => {
          if (res.cssFilter) d.designFilter = res.cssFilter;
        });
      }
      push(res.note, "success");
    } finally {
      setApplying(null);
    }
  }

  function addObject(product: Product) {
    addProduct(product);
    push(`"${product.name}" añadido a la escena.`, "success");
  }

  return (
    <div className="flex h-full">
      {/* group rail */}
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
              title={GROUP_LABELS[g]}
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

      {/* panel */}
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="border-b border-line px-4 pb-3 pt-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">{GROUP_LABELS[group]}</h2>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs",
                showFilters ? "border-clay text-clay" : "border-line-strong text-ink-soft",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line-strong px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto, marca, referencia…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              Todo
            </Chip>
            {groupCategories.map((c) => (
              <Chip
                key={c.key}
                active={category === c.key}
                onClick={() => setCategory(category === c.key ? null : c.key)}
              >
                {c.label}
              </Chip>
            ))}
          </div>

          {showFilters && (
            <div className="mt-3 space-y-2.5 rounded-xl bg-paper p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs"
                >
                  <option value="">Todas las marcas</option>
                  {productService.brands().map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs"
                >
                  <option value="">Cualquier estilo</option>
                  {productService.styles().map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Precio máx.</span>
                  <span>{maxPrice ? formatCurrency(maxPrice) : "Sin límite"}</span>
                </div>
                <input
                  type="range"
                  min={Math.floor(priceMin)}
                  max={Math.ceil(priceMax)}
                  value={maxPrice ?? Math.ceil(priceMax)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxPrice(v >= Math.ceil(priceMax) ? null : v);
                  }}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          )}

          {activeSurface && (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-clay-tint px-2.5 py-1.5 text-[11px] text-clay-dark">
              <Wand2 className="h-3.5 w-3.5" />
              Zona activa: {SURFACE_LABEL[activeSurface]}. Aplica un material para verlo en la escena.
              <button className="ml-auto underline" onClick={() => setActiveSurface(null)}>
                quitar
              </button>
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid gap-2.5">
            {results.map((p) => {
              const isSurface = categoryMeta(p.category).kind === "surface";
              return (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-xl border border-line p-2.5 transition-colors hover:border-ink/20"
                >
                  <div
                    className="h-16 w-16 shrink-0 rounded-lg border border-line"
                    style={{ background: p.swatch }}
                  >
                    {p.sprite && (
                      <span className="grid h-full w-full place-items-center text-2xl">
                        {p.sprite}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {p.brand} · {p.reference}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {p.style} · {p.color}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">
                        {formatCurrency(p.price)}
                        <span className="text-[11px] font-normal text-muted">
                          {" "}
                          /{UNIT_LABELS[p.unit]}
                        </span>
                      </span>
                      <button
                        onClick={() => (isSurface ? applySurface(p) : addObject(p))}
                        disabled={applying === p.id}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-[12px] font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                      >
                        {applying === p.id ? (
                          "Aplicando…"
                        ) : isSurface ? (
                          <>
                            <Wand2 className="h-3 w-3" /> Aplicar
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" /> Añadir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {results.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">
                No hay productos con esos filtros.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SURFACE_LABEL: Record<SurfaceKind, string> = {
  floor: "Suelo",
  wall: "Paredes",
  ceiling: "Techo",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-clay bg-clay-tint text-clay-dark"
          : "border-line-strong text-ink-soft hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}
