"use client";

import { Copy, Trash2, Minus, Plus, RotateCw, Maximize2 } from "lucide-react";
import type { ProjectItem, Project } from "@/types";
import { UNIT_LABELS } from "@/types";
import { productById } from "@/data/catalog";
import { useEditor } from "@/lib/store";
import { itemQuantity, itemMaterialSubtotal, itemLaborSubtotal, itemTotal } from "@/lib/calc";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ItemInspector({ item, project }: { item: ProjectItem; project: Project }) {
  const { updateItem, transformItem, mutate, removeItem, duplicateItem } = useEditor();
  const product = productById(item.productId);
  const qty = itemQuantity(item, project.dimensions);
  const isSurface = item.kind === "surface";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div
          className="h-14 w-14 shrink-0 rounded-lg border border-line"
          style={{ background: product?.swatch }}
        >
          {product?.sprite && (
            <span className="grid h-full w-full place-items-center text-2xl">{product.sprite}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-ink">{item.name}</p>
          <p className="text-xs text-muted">
            {item.brand} · {product?.reference}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatCurrency(itemTotal(item, project.dimensions))}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <Field label="Nombre">
          <Input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={`Precio unitario (€/${UNIT_LABELS[item.unit]})`}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
            />
          </Field>
          <Field label={`Mano de obra (€/${UNIT_LABELS[item.unit]})`}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.laborPrice}
              onChange={(e) => updateItem(item.id, { laborPrice: Number(e.target.value) })}
            />
          </Field>
        </div>

        {isSurface ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desperdicio (%)">
              <Input
                type="number"
                step="1"
                min="0"
                value={item.wastePct}
                onChange={(e) =>
                  mutate((d) => {
                    const it = d.items.find((x) => x.id === item.id);
                    if (it) {
                      it.wastePct = Number(e.target.value);
                      it.quantityAuto = true;
                    }
                  })
                }
              />
            </Field>
            <Field label={`Cantidad (${UNIT_LABELS[item.unit]})`}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formatNumber(qty)}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
              />
            </Field>
            {item.quantityAuto && (
              <p className="col-span-2 text-[11px] text-muted">
                Cantidad calculada automáticamente a partir de las dimensiones + {item.wastePct}% de
                desperdicio.
              </p>
            )}
          </div>
        ) : (
          <Field label="Cantidad">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong text-ink-soft hover:border-ink/30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <Input
                type="number"
                min="1"
                className="text-center"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
              />
              <button
                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong text-ink-soft hover:border-ink/30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </Field>
        )}
      </div>

      {!isSurface && (
        <div className="space-y-2 rounded-xl bg-paper p-3">
          <SliderRow
            icon={<RotateCw className="h-3.5 w-3.5" />}
            label="Rotación"
            value={item.transform.rotation}
            min={-180}
            max={180}
            step={1}
            suffix="°"
            onChange={(v) => transformItem(item.id, { rotation: v })}
            onCommit={() => mutate(() => {})}
          />
          <SliderRow
            icon={<Maximize2 className="h-3.5 w-3.5" />}
            label="Escala"
            value={Math.round(item.transform.scale * 100)}
            min={30}
            max={400}
            step={5}
            suffix="%"
            onChange={(v) => transformItem(item.id, { scale: v / 100 })}
            onCommit={() => mutate(() => {})}
          />
        </div>
      )}

      <dl className="space-y-1 rounded-xl border border-line p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Materiales</dt>
          <dd className="tabular-nums">{formatCurrency(itemMaterialSubtotal(item, project.dimensions))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Mano de obra</dt>
          <dd className="tabular-nums">{formatCurrency(itemLaborSubtotal(item, project.dimensions))}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-1 font-semibold">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatCurrency(itemTotal(item, project.dimensions))}</dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicateItem(item.id)}>
          <Copy className="h-4 w-4" /> Duplicar
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={() => removeItem(item.id)}>
          <Trash2 className="h-4 w-4" /> Eliminar
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  onCommit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        className="mt-1 w-full"
      />
    </div>
  );
}
