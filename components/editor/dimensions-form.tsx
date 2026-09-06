"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { surfaceAreas } from "@/lib/calculations/dimensions";
import { fromInches, toInches } from "@/lib/calculations/units";
import { formatArea, formatLinear } from "@/lib/format";
import { Field, Input } from "@/components/ui/field";

export function DimensionsForm({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const setDimensions = useEditor((s) => s.setDimensions);
  const room = bundle.rooms[0];
  if (!room) return null;
  const dims = { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn };
  const a = surfaceAreas(dims);
  const w = fromInches(dims.widthIn), l = fromInches(dims.lengthIn), h = fromInches(dims.heightIn);

  const set = (axis: "widthIn" | "lengthIn" | "heightIn", feet: number, inches: number) => {
    void setDimensions({ [axis]: toInches({ feet, inches }) });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">{t("editor.dimensions")}</h3>
        <span className="rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-medium text-clay-dark">
          {room.measurementSource === "manual" ? t("editor.measured") : t("editor.estimated")}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {([["widthIn", t("editor.width"), w], ["lengthIn", t("editor.length"), l], ["heightIn", t("editor.height"), h]] as const).map(
          ([axis, label, val]) => (
            <Field key={axis} label={label}>
              <div className="flex items-center gap-1">
                <Input type="number" min="0" className="text-center" defaultValue={val.feet} key={`${axis}f${val.feet}`} onBlur={(e) => set(axis, Number(e.target.value), val.inches)} />
                <span className="text-xs text-muted">ft</span>
                <Input type="number" min="0" max="11" className="text-center" defaultValue={val.inches} key={`${axis}i${val.inches}`} onBlur={(e) => set(axis, val.feet, Number(e.target.value))} />
                <span className="text-xs text-muted">in</span>
              </div>
            </Field>
          ),
        )}
      </div>
      <dl className="mt-4 space-y-1.5 rounded-xl bg-paper p-3 text-sm">
        <Row label={t("editor.floor_ceiling")} value={formatArea(a.floorAreaSqFt, "imperial", locale)} />
        <Row label={t("editor.wall_area")} value={formatArea(a.wallAreaSqFt, "imperial", locale)} />
        <Row label={t("editor.perimeter")} value={formatLinear(a.perimeterLinFt, "imperial", locale)} />
        <p className="pt-1 text-[11px] text-muted">
          {t("editor.dimensions_note", {
            w: `${w.feet}′${w.inches ? ` ${w.inches}″` : ""}`,
            l: `${l.feet}′${l.inches ? ` ${l.inches}″` : ""}`,
            area: formatArea(a.floorAreaSqFt, "imperial", locale),
          })}
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
