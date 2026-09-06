"use client";

import type { Project } from "@/types";
import { useEditor } from "@/lib/store";
import { surfaceAreas } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { Field, Input } from "@/components/ui/field";

export function DimensionsForm({ project }: { project: Project }) {
  const setDimensions = useEditor((s) => s.setDimensions);
  const d = project.dimensions;
  const a = surfaceAreas(d);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">Dimensiones del espacio</h3>
        <span className="rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-medium text-clay-dark">
          {d.estimated ? "Estimación IA" : "Medidas reales"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["width", "length", "height"] as const).map((k) => (
          <Field key={k} label={{ width: "Ancho", length: "Largo", height: "Altura" }[k]}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={d[k]}
              onChange={(e) => setDimensions({ [k]: Number(e.target.value) })}
            />
          </Field>
        ))}
      </div>

      <dl className="mt-4 space-y-1.5 rounded-xl bg-paper p-3 text-sm">
        <Row label="Superficie de suelo / techo" value={`${formatNumber(a.floor)} m²`} />
        <Row label="Superficie de paredes" value={`${formatNumber(a.wall)} m²`} />
        <Row label="Perímetro" value={`${formatNumber(a.perimeter)} ml`} />
        <p className="pt-1 text-[11px] text-muted">
          {formatNumber(d.width)} × {formatNumber(d.length)} = {formatNumber(a.floor)} m². Las
          cantidades de material añaden el desperdicio recomendado.
        </p>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}
