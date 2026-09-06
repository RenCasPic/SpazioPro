"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import type { EstimateExtras } from "@/types";
import { useEditor } from "@/hooks/use-editor";
import { useT } from "@/components/localization/i18n-provider";
import { Field, Input, Textarea } from "@/components/ui/field";
import { taxService } from "@/lib/market/tax-service";

const EXTRA_KEYS: Array<keyof EstimateExtras> = ["equipment", "delivery", "disposal", "permits", "other"];

export function BudgetSettings({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const { updateSettings } = useEditor();
  const s = bundle.config.settings;
  const loc = bundle.location;
  const tax = loc ? taxService.getTaxRate({ stateCode: loc.stateCode, city: loc.city, zipCode: loc.zipCode }) : null;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl text-ink">{t("estimates.settings.title")}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("estimates.settings.sales_tax")} hint={tax ? t("estimates.settings.tax_note", { jurisdiction: tax.jurisdiction.name }) : undefined}>
          <Input type="number" min="0" step="0.001" value={s.salesTaxRate} onChange={(e) => updateSettings({ salesTaxRate: Number(e.target.value) })} />
        </Field>
        <Field label={t("estimates.settings.discount")}>
          <Input type="number" min="0" step="1" value={s.discountPercent} onChange={(e) => updateSettings({ discountPercent: Number(e.target.value) })} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {EXTRA_KEYS.map((k) => (
          <Field key={k} label={t(`estimates.settings.${k}`)}>
            <Input
              type="number"
              min="0"
              step="10"
              value={s.extras[k]}
              onChange={(e) => updateSettings({ extras: { ...s.extras, [k]: Number(e.target.value) } })}
            />
          </Field>
        ))}
      </div>

      <Field label={t("estimates.settings.scope_of_work")}>
        <Textarea rows={4} defaultValue={s.scopeOfWork} key={s.scopeOfWork} onBlur={(e) => updateSettings({ scopeOfWork: e.target.value })} placeholder={"Remove existing flooring.\nPrepare subfloor.\nInstall new flooring.\nInstall baseboards.\nClean work area."} />
      </Field>

      <Field label={t("estimates.settings.notes")}>
        <Textarea rows={2} defaultValue={s.notes} key={s.notes} onBlur={(e) => updateSettings({ notes: e.target.value })} />
      </Field>
    </div>
  );
}
