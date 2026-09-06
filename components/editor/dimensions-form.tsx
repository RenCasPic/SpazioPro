"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { surfaceAreas } from "@/lib/calculations/quantities";
import { formatNumber } from "@/lib/format";
import { Field, Input } from "@/components/ui/field";

export function DimensionsForm({ bundle }: { bundle: ProjectBundle }) {
  const setDimensions = useEditor((s) => s.setDimensions);
  const room = bundle.rooms[0];
  if (!room) return null;
  const dims = { width: room.width, length: room.length, height: room.height };
  const a = surfaceAreas(dims);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">Dimensiones</h3>
        <span className="rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-medium text-clay-dark">
          {room.measurementSource === "manual" ? "Medidas reales" : "Estimación IA"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["width", "length", "height"] as const).map((k) => (
          <Field key={k} label={{ width: "Ancho", length: "Largo", height: "Altura" }[k]}>
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={dims[k]}
              key={dims[k]}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v > 0 && v !== dims[k]) void setDimensions({ [k]: v });
              }}
            />
          </Field>
        ))}
      </div>
      <dl className="mt-4 space-y-1.5 rounded-xl bg-paper p-3 text-sm">
        <Row label="Suelo / techo" value={`${formatNumber(a.floorArea)} m²`} />
        <Row label="Paredes" value={`${formatNumber(a.wallArea)} m²`} />
        <Row label="Perímetro" value={`${formatNumber(a.perimeter)} ml`} />
        <p className="pt-1 text-[11px] text-muted">
          {formatNumber(dims.width)} × {formatNumber(dims.length)} = {formatNumber(a.floorArea)} m². Las
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
