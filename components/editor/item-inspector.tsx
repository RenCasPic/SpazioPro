"use client";

import { Copy, Trash2, Minus, Plus, RotateCw, Maximize2 } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import type { ProjectItem } from "@/types";
import { UNIT_KEYS } from "@/lib/constants";
import { productById } from "@/data/catalog";
import { useEditor } from "@/hooks/use-editor";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { resolveItemQuantity, itemBreakdown } from "@/lib/calculations/estimate";
import { formatUsd, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ItemInspector({ item, bundle }: { item: ProjectItem; bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { updateItem, setTransform, commitTransform, removeItem, duplicateItem } = useEditor();
  const product = productById(item.productId);
  const room = bundle.rooms[0];
  const dims = room ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn } : { widthIn: 144, lengthIn: 180, heightIn: 108 };
  const b = itemBreakdown(item, dims);
  const isSurface = item.kind === "surface";
  const money = (n: number) => formatUsd(n, locale);
  const unit = t(UNIT_KEYS[item.unit]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="h-14 w-14 shrink-0 rounded-lg border border-line" style={{ background: product?.swatch }}>
          {product?.sprite && <span className="grid h-full w-full place-items-center text-2xl">{product.sprite}</span>}
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-ink">{item.name}</p>
          <p className="text-xs text-muted">{product?.brand} · {product?.sku}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{money(b.total)}</p>
        </div>
      </div>

      <Field label={t("editor.name")}>
        <Input defaultValue={item.name} key={item.name} onBlur={(e) => updateItem(item.id, { name: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={`${t("editor.price")} ($/${unit})`}>
          <Input type="number" step="0.01" min="0" defaultValue={item.unitPrice} key={item.unitPrice} onBlur={(e) => updateItem(item.id, { unitPrice: Number(e.target.value), priceSource: "market" })} />
        </Field>
        <Field label={`${t("editor.labor")} ($/${unit})`}>
          <Input type="number" step="0.01" min="0" defaultValue={item.laborCost} key={item.laborCost} onBlur={(e) => updateItem(item.id, { laborCost: Number(e.target.value) })} />
        </Field>
      </div>

      {isSurface ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("editor.waste")}>
            <Input type="number" step="1" min="0" defaultValue={item.wastePercent} key={item.wastePercent} onBlur={(e) => updateItem(item.id, { wastePercent: Number(e.target.value), quantityAuto: true })} />
          </Field>
          <Field label={`${t("editor.quantity")} (${unit})`}>
            <Input type="number" step="0.01" min="0" defaultValue={formatNumber(resolveItemQuantity(item, dims), 2, locale)} key={`${item.quantity}${item.quantityAuto}`} onBlur={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} />
          </Field>
          {item.quantityAuto && <p className="col-span-2 text-[11px] text-muted">{t("editor.quantity_auto", { pct: item.wastePercent })}</p>}
        </div>
      ) : (
        <Field label={t("editor.quantity")}>
          <div className="flex items-center gap-2">
            <button onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong text-ink-soft hover:border-ink/30">
              <Minus className="h-4 w-4" />
            </button>
            <Input type="number" min="1" className="text-center" defaultValue={item.quantity} key={item.quantity} onBlur={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })} />
            <button onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong text-ink-soft hover:border-ink/30">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Field>
      )}

      {!isSurface && (
        <div className="space-y-2 rounded-xl bg-paper p-3">
          <Slider icon={<RotateCw className="h-3.5 w-3.5" />} label={t("editor.rotation")} suffix="°" value={item.transform.rotation} min={-180} max={180} step={1} onChange={(v) => setTransform(item.id, { rotation: v })} onCommit={commitTransform} />
          <Slider icon={<Maximize2 className="h-3.5 w-3.5" />} label={t("editor.scale")} suffix="%" value={Math.round(item.transform.scale * 100)} min={30} max={400} step={5} onChange={(v) => setTransform(item.id, { scale: v / 100 })} onCommit={commitTransform} />
        </div>
      )}

      <dl className="space-y-1 rounded-xl border border-line p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("estimates.cost_lines.materials")}</dt>
          <dd className="tabular-nums">{money(b.materialCost)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("estimates.cost_lines.labor")}</dt>
          <dd className="tabular-nums">{money(b.laborCost)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-1 font-semibold">
          <dt>{t("editor.subtotal")}</dt>
          <dd className="tabular-nums">{money(b.total)}</dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicateItem(item.id)}>
          <Copy className="h-4 w-4" /> {t("common.actions.duplicate")}
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={() => removeItem(item.id)}>
          <Trash2 className="h-4 w-4" /> {t("common.actions.delete")}
        </Button>
      </div>
    </div>
  );
}

function Slider({ icon, label, suffix, value, min, max, step, onChange, onCommit }: { icon: React.ReactNode; label: string; suffix: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; onCommit: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} onPointerUp={onCommit} className="mt-1 w-full" />
    </div>
  );
}
