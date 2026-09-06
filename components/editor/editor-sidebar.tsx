"use client";

import { useMemo, useState } from "react";
import {
  LayoutGrid,
  PaintBucket,
  ChefHat,
  Bath,
  Sofa,
  Lightbulb,
  Search,
  Plus,
  Wand2,
  Sparkles,
} from "lucide-react";
import type { ProductGroup } from "@/types";
import { CATEGORIES, GROUP_LABELS_EN, GROUP_LABELS_ES, GROUP_ORDER, categoryMeta } from "@/data/categories";
import { SURFACE_KEYS, UNIT_KEYS } from "@/lib/constants";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { useCatalog } from "@/hooks/use-products";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { materialPhoto } from "@/lib/media/material-photo";
import { formatUsd0 } from "@/lib/format";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<ProductGroup, typeof Sofa> = {
  flooring: LayoutGrid,
  walls: PaintBucket,
  kitchen: ChefHat,
  bathroom: Bath,
  furniture: Sofa,
  lighting: Lightbulb,
};

type Quality = "any" | "economy" | "standard" | "premium";

export function EditorSidebar({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { addProduct, activeSurface, setActiveSurface, applying } = useEditor();
  const push = useToasts((s) => s.push);
  const state = bundle.project.stateCode;

  const [group, setGroup] = useState<ProductGroup>(
    activeSurface === "floor" ? "flooring" : activeSurface === "wall" ? "walls" : "flooring",
  );
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState<Quality>("any");

  const groupLabel = (g: ProductGroup) => (locale === "es-US" ? GROUP_LABELS_ES : GROUP_LABELS_EN)[g];
  const groupCategories = CATEGORIES.filter((c) => c.group === group);

  const entries = useCatalog(
    useMemo(
      () => ({
        stateCode: state,
        group,
        category: (category as never) ?? undefined,
        query: query || undefined,
      }),
      [state, group, category, query],
    ),
  );

  // Quality tiers are relative to what's on screen: cheapest third = Budget, etc.
  const tierOf = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.price.money.amount - b.price.money.amount);
    const n = sorted.length;
    const map = new Map<string, Quality>();
    sorted.forEach((e, i) => {
      map.set(e.product.id, i < n / 3 ? "economy" : i < (2 * n) / 3 ? "standard" : "premium");
    });
    return map;
  }, [entries]);

  const shown = entries.filter((e) => quality === "any" || tierOf.get(e.product.id) === quality);

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
                group === g ? "bg-accent text-white" : "text-ink-soft hover:bg-ink/5",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="border-b border-line px-4 pb-3 pt-3.5">
          <h2 className="font-serif text-[17px] text-ink">
            {activeSurface
              ? t("editor.studio.materials_for", { surface: t(`editor.studio.surface_${activeSurface}`) })
              : groupLabel(group)}
          </h2>

          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line-strong px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("editor.search_placeholder")}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {(["any", "economy", "standard", "premium"] as Quality[]).map((q) => (
              <Chip key={q} active={quality === q} onClick={() => setQuality(q)}>
                {t(`editor.quality.${q === "any" ? "any" : q}`)}
              </Chip>
            ))}
          </div>

          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            <Chip active={category === null} onClick={() => setCategory(null)} subtle>
              {t("editor.all")}
            </Chip>
            {groupCategories.map((c) => (
              <Chip
                key={c.key}
                active={category === c.key}
                onClick={() => setCategory(category === c.key ? null : c.key)}
                subtle
              >
                {c.label}
              </Chip>
            ))}
          </div>

          {activeSurface && (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-accent-tint px-2.5 py-1.5 text-[11px] text-accent">
              <Wand2 className="h-3.5 w-3.5" />
              {t("editor.active_zone", { zone: t(SURFACE_KEYS[activeSurface]) })}
              <button className="ml-auto underline" onClick={() => setActiveSurface(null)}>
                {t("editor.remove")}
              </button>
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2.5">
            {shown.map((entry) => {
              const { product, price } = entry;
              const isSurface = categoryMeta(product.category).kind === "surface";
              const photo = materialPhoto(product.id, product.category);
              const estimated = price.source === "converted" || price.source === "missing" || product.demo;
              return (
                <button
                  key={product.id}
                  onClick={() => apply(entry)}
                  disabled={applying === product.id}
                  className="group overflow-hidden rounded-xl border border-line text-left transition-colors hover:border-accent/40 disabled:opacity-60"
                >
                  <div className="relative aspect-[4/3] bg-canvas" style={{ background: product.swatch }}>
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {isSurface ? <Wand2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[12.5px] font-medium text-ink">{product.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                      {estimated && <Sparkles className="h-2.5 w-2.5" />}
                      {formatUsd0(price.money.amount, locale)}
                      <span>/{t(UNIT_KEYS[product.unit])}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {shown.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">{t("catalog.no_results")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  subtle,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? subtle
            ? "border-accent bg-accent-tint text-accent"
            : "border-accent bg-accent text-white"
          : "border-line-strong text-ink-soft hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}
