"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Dimensions, RoomType, VisionResult } from "@/types";
import { ROOM_TYPE_LABELS } from "@/types";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PhotoUploader } from "@/components/upload/photo-uploader";
import { AnalyzePanel } from "@/components/analyze/analyze-panel";
import { useProjects } from "@/lib/store";
import { projectService } from "@/services/projectService";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as RoomType[];

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useProjects((s) => s.create);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("living_room");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function goToUpload() {
    setSaving(true);
    const project = await createProject({ name, roomType });
    setProjectId(project.id);
    setSaving(false);
    setStep(2);
  }

  async function handlePhoto(dataUrl: string) {
    setPhoto(dataUrl);
    if (projectId) {
      const project = await projectService.get(projectId);
      if (project) await projectService.save({ ...project, photo: dataUrl });
    }
    setStep(3);
  }

  async function finish(vision: VisionResult, dimensions: Dimensions) {
    if (!projectId) return;
    const project = await projectService.get(projectId);
    if (project) {
      await projectService.save({
        ...project,
        photo: photo ?? project.photo,
        vision,
        roomType: vision.room_type,
        dimensions,
        status: "designing",
      });
    }
    router.push(`/projects/${projectId}/editor`);
  }

  return (
    <div className="min-h-full">
      <AppHeader cta={false} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Stepper step={step} />

        {step === 1 && (
          <section className="mt-8 animate-in">
            <h1 className="font-serif text-3xl tracking-tight text-ink">Diseña tu espacio</h1>
            <p className="mt-1 text-sm text-ink-soft">Empecemos con lo básico del proyecto.</p>

            <div className="mt-7 space-y-5">
              <Field label="Nombre del proyecto">
                <Input
                  autoFocus
                  placeholder="Salón Casa García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Tipo de espacio">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ROOM_TYPES.map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setRoomType(rt)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                        roomType === rt
                          ? "border-clay bg-clay-tint text-clay-dark"
                          : "border-line-strong text-ink hover:border-ink/30",
                      )}
                    >
                      {ROOM_TYPE_LABELS[rt]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={goToUpload} disabled={!name.trim() || saving}>
                {saving ? "Creando…" : "Continuar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 animate-in">
            <button
              onClick={() => setStep(1)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <PhotoUploader onReady={handlePhoto} />
          </section>
        )}

        {step === 3 && photo && (
          <section className="mt-8 animate-in">
            <AnalyzePanel image={photo} hintRoomType={roomType} onConfirm={finish} />
          </section>
        )}
      </main>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Proyecto", "Fotografía", "Análisis"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                done
                  ? "bg-sage text-white"
                  : active
                    ? "bg-clay text-white"
                    : "bg-line text-muted",
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
