"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import type { z } from "zod";
import type { ProjectBundle } from "@/lib/services/project-service";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StateSelect } from "@/components/countries/state-select";
import { useEditor } from "@/hooks/use-editor";
import { useT } from "@/components/localization/i18n-provider";
import { changeLocationSchema } from "@/lib/validations/project";
import { taxService } from "@/lib/market/tax-service";

type FormValues = z.infer<typeof changeLocationSchema>;

export function ChangeLocationDialog({
  open,
  onClose,
  bundle,
}: {
  open: boolean;
  onClose: () => void;
  bundle: ProjectBundle;
}) {
  const t = useT();
  const changeLocation = useEditor((s) => s.changeLocation);
  const [working, setWorking] = useState(false);
  const { register, handleSubmit, control, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(changeLocationSchema),
    defaultValues: {
      address: bundle.location?.address ?? "",
      city: bundle.location?.city ?? "",
      stateCode: bundle.location?.stateCode ?? bundle.project.stateCode,
      zipCode: bundle.location?.zipCode ?? "",
    },
  });

  const state = watch("stateCode");
  const city = watch("city");
  const zip = watch("zipCode");
  const preview = taxService.getTaxRate({ stateCode: state, city, zipCode: zip });

  async function onSubmit(values: FormValues) {
    setWorking(true);
    await changeLocation(values);
    setWorking(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("projects.settings.location_title")} description={t("projects.settings.location_note")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input placeholder={t("projects.new.address_placeholder")} {...register("address")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("projects.new.city")} className="sm:col-span-2">
            <Input {...register("city")} />
          </Field>
          <Field label={t("projects.new.state")}>
            <Controller control={control} name="stateCode" render={({ field }) => <StateSelect value={field.value} onChange={field.onChange} />} />
          </Field>
          <Field label={t("projects.new.zip")}>
            <Input inputMode="numeric" maxLength={5} {...register("zipCode")} />
          </Field>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-clay-tint/60 px-3 py-2.5 text-xs text-clay-dark">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("estimates.settings.tax_note", { jurisdiction: preview.jurisdiction.name })}: {preview.rate}% · {bundle.items.length} item(s) will be repriced. Existing estimates keep their snapshot.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={working}>
            {t("common.actions.cancel")}
          </Button>
          <Button type="submit" disabled={working || !formState.isValid}>
            {working ? "…" : t("common.actions.save_changes")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
