"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Client, ProjectType, RoomAnalysis, RoomDimensions } from "@/types";
import { PROJECT_TYPE_LABELS } from "@/types";
import { newProjectSchema, type NewProjectInput } from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CountrySelect } from "@/components/countries/country-select";
import { PhotoUploader } from "@/components/projects/photo-uploader";
import { AnalyzePanel } from "@/components/projects/analyze-panel";
import { clientService } from "@/lib/services/client-service";
import { projectService } from "@/lib/services/project-service";
import { roomService } from "@/lib/services/room-service";
import { imageService } from "@/lib/services/image-service";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

export default function NewProjectPage() {
  const router = useRouter();
  const { profile } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState } = useForm<NewProjectInput>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: { name: "", clientId: null, countryCode: "ES", projectType: "living_room", description: "" },
  });

  useEffect(() => {
    void clientService.list().then(setClients);
  }, []);
  useEffect(() => {
    if (profile?.countryCode) setValue("countryCode", profile.countryCode);
  }, [profile, setValue]);

  const projectType = watch("projectType");

  async function createProject(values: NewProjectInput) {
    const project = await projectService.create({
      ...values,
      description: values.description ?? "",
    });
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
      <Stepper step={step} />

      {step === 1 && (
        <form onSubmit={handleSubmit(createProject)} className="mt-8 animate-in space-y-5">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-ink">Nuevo proyecto</h1>
            <p className="mt-1 text-sm text-ink-soft">El país define moneda, impuestos, catálogo, mano de obra y transporte.</p>
          </div>

          <Field label="Nombre del proyecto">
            <Input autoFocus placeholder="Reforma salón Casa García" {...register("name")} />
            {formState.errors.name && <p className="mt-1 text-xs text-red-600">{formState.errors.name.message}</p>}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente">
              <Select {...register("clientId")}>
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="País / mercado">
              <Controller
                control={control}
                name="countryCode"
                render={({ field }) => <CountrySelect value={field.value} onChange={field.onChange} />}
              />
            </Field>
          </div>

          <Field label="Tipo de espacio">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("projectType", t)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    projectType === t
                      ? "border-clay bg-clay-tint text-clay-dark"
                      : "border-line-strong text-ink hover:border-ink/30",
                  )}
                >
                  {PROJECT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Descripción (opcional)">
            <Textarea rows={3} {...register("description")} placeholder="Notas del encargo, alcance, estilo deseado…" />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Creando…" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="mt-8 animate-in">
          <button onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Volver
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

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Proyecto", "Fotografía", "Análisis"];
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
