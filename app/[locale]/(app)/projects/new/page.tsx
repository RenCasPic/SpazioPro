"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Client, ProjectType, RoomAnalysis, RoomDimensions } from "@/types";
import { PROJECT_TYPES } from "@/types";
import { newProjectSchema, type NewProjectInput } from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StateSelect } from "@/components/countries/state-select";
import { PhotoUploader } from "@/components/projects/photo-uploader";
import { AnalyzePanel } from "@/components/projects/analyze-panel";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useT } from "@/components/localization/i18n-provider";
import { clientService } from "@/lib/services/client-service";
import { projectService } from "@/lib/services/project-service";
import { roomService } from "@/lib/services/room-service";
import { imageService } from "@/lib/services/image-service";
import { useSession } from "@/hooks/use-session";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export default function NewProjectPage() {
  const t = useT();
  const router = useLocaleRouter();
  const { profile } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState } = useForm<NewProjectInput>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      clientId: null,
      projectType: "kitchen",
      description: "",
      address: "",
      city: "",
      stateCode: "TX",
      zipCode: "",
      estimateLanguage: "en-US",
    },
  });

  useEffect(() => {
    void clientService.list().then(setClients);
  }, []);
  useEffect(() => {
    if (profile?.defaultStateCode) setValue("stateCode", profile.defaultStateCode);
    if (profile?.defaultZip) setValue("zipCode", profile.defaultZip);
    if (profile?.estimateLanguage) setValue("estimateLanguage", profile.estimateLanguage);
  }, [profile, setValue]);

  const projectType = watch("projectType");

  async function createProject(values: NewProjectInput) {
    const project = await projectService.create({ ...values, description: values.description ?? "" });
    setProjectId(project.id);
    setStep(2);
  }

  async function handlePhoto(dataUrl: string) {
    setPhoto(dataUrl);
    if (projectId) {
      const room = await roomService.primary(projectId);
      await imageService.addOriginal(projectId, room?.id ?? null, dataUrl);
      await projectService.update(projectId, { status: "designing" });
    }
    setStep(3);
  }

  async function finish(analysis: RoomAnalysis, dims: RoomDimensions) {
    if (!projectId) return;
    const room = await roomService.primary(projectId);
    if (room) {
      await roomService.applyAnalysis(room.id, analysis);
      await roomService.setDimensions(room.id, dims, "ai_estimate");
    }
    await projectService.update(projectId, { projectType: analysis.roomType });
    router.push(`/projects/${projectId}/editor`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} labels={[t("projects.new.steps.project"), t("projects.new.steps.photo"), t("projects.new.steps.analysis")]} />

      {step === 1 && (
        <form onSubmit={handleSubmit(createProject)} className="mt-8 animate-in space-y-5">
          <div>
            <h1 className="display text-[28px] text-ink">{t("projects.new.title")}</h1>
            <p className="mt-1 text-sm text-ink-soft">{t("projects.new.subtitle")}</p>
          </div>

          <Field label={t("projects.new.name")}>
            <Input autoFocus placeholder={t("projects.new.name_placeholder")} {...register("name")} />
            {formState.errors.name && <p className="mt-1 text-xs text-red-600">{formState.errors.name.message}</p>}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("projects.new.client")}>
              <Select {...register("clientId")}>
                <option value="">{t("projects.new.no_client")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("projects.new.estimate_language")}>
              <Select {...register("estimateLanguage")}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t("projects.new.type")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROJECT_TYPES.map((ty: ProjectType) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setValue("projectType", ty)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    projectType === ty ? "border-clay bg-clay-tint text-clay-dark" : "border-line-strong text-ink hover:border-ink/30",
                  )}
                >
                  {t(`common.project_type.${ty}`)}
                </button>
              ))}
            </div>
          </Field>

          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("projects.new.address")}</p>
            <div className="mt-3 space-y-3">
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
              {(formState.errors.city || formState.errors.stateCode || formState.errors.zipCode) && (
                <p className="text-xs text-red-600">
                  {formState.errors.city?.message ?? formState.errors.stateCode?.message ?? formState.errors.zipCode?.message}
                </p>
              )}
            </div>
          </div>

          <Field label={t("projects.new.description")}>
            <Textarea rows={3} {...register("description")} placeholder={t("projects.new.description_placeholder")} />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" disabled={formState.isSubmitting}>
              {t("common.actions.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="mt-8 animate-in">
          <button onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {t("common.actions.back")}
          </button>
          <PhotoUploader onReady={handlePhoto} />
        </div>
      )}

      {step === 3 && photo && (
        <div className="mt-8 animate-in">
          <AnalyzePanel image={photo} hint={projectType} onConfirm={finish} />
        </div>
      )}
    </div>
  );
}

function Stepper({ step, labels }: { step: 1 | 2 | 3; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                done ? "bg-sage text-white" : active ? "bg-clay text-white" : "bg-line text-muted",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cn("text-sm", active ? "text-ink" : "text-muted")}>{label}</span>
            {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-line-strong" />}
          </div>
        );
      })}
    </div>
  );
}
