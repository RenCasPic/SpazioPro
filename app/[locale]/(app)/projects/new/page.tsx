"use client";

import { useEffect, useMemo, useState } from "react";
import { Ruler, MapPin, Sparkles, ScanSearch } from "lucide-react";
import type { ProjectType, RoomAnalysis } from "@/types";
import { PhotoUploader } from "@/components/projects/photo-uploader";
import { StateSelect } from "@/components/countries/state-select";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useSession } from "@/hooks/use-session";
import { projectService } from "@/lib/services/project-service";
import { roomService } from "@/lib/services/room-service";
import { imageService } from "@/lib/services/image-service";
import { vision } from "@/lib/ai/vision";
import { toInches } from "@/lib/calculations/units";
import { cn } from "@/lib/utils";

/** A friendly default name so the user never has to name the project up front. */
function defaultName(type: ProjectType, locale: string): string {
  const es = locale === "es-US";
  const map: Record<ProjectType, [string, string]> = {
    kitchen: ["My kitchen", "Mi cocina"],
    bathroom: ["My bathroom", "Mi baño"],
    living_room: ["My living room", "Mi sala"],
    bedroom: ["My bedroom", "Mi dormitorio"],
    office: ["My office", "Mi oficina"],
    commercial: ["My space", "Mi local"],
    terrace: ["My terrace", "Mi terraza"],
    exterior: ["My exterior", "Mi exterior"],
    whole_home: ["My home", "Mi casa"],
    other: ["My space", "Mi espacio"],
  };
  return map[type][es ? 1 : 0];
}

export default function NewProjectPage() {
  const t = useT();
  const locale = useLocale();
  const router = useLocaleRouter();
  const { profile } = useSession();

  const [stateCode, setStateCode] = useState("TX");
  const [city, setCity] = useState("");
  const [mode, setMode] = useState<"photo" | "dims">("photo");
  const [dims, setDims] = useState({ w: 12, l: 15, h: 9 });
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [detected, setDetected] = useState<RoomAnalysis | null>(null);

  useEffect(() => {
    if (profile?.defaultStateCode) setStateCode(profile.defaultStateCode);
    if (profile?.city) setCity(profile.city);
  }, [profile]);

  const phases = useMemo(
    () => [
      t("projects.analyze.phase_segment"),
      t("projects.analyze.phase_openings"),
      t("projects.analyze.phase_furniture"),
      t("projects.analyze.phase_dimensions"),
    ],
    [t],
  );

  useEffect(() => {
    if (!busy || detected) return;
    const id = setInterval(() => setPhase((p) => (p + 1) % phases.length), 700);
    return () => clearInterval(id);
  }, [busy, detected, phases.length]);

  async function createBase(type: ProjectType) {
    return projectService.create({
      name: "",
      clientId: null,
      projectType: type,
      description: "",
      address: "",
      city,
      stateCode,
      zipCode: profile?.defaultZip ?? "",
      estimateLanguage: profile?.estimateLanguage ?? "en-US",
    });
  }

  async function startFromPhoto(dataUrl: string) {
    setBusy(true);
    try {
      const project = await createBase("other");
      const room = await roomService.primary(project.id);
      await imageService.addOriginal(project.id, room?.id ?? null, dataUrl);

      const analysis = await vision.analyzeRoom(dataUrl).catch(() => null);
      if (analysis && room) {
        await roomService.applyAnalysis(room.id, analysis);
        await projectService.update(project.id, {
          projectType: analysis.roomType,
          name: defaultName(analysis.roomType, locale),
          status: "designing",
        });
        setDetected(analysis);
      } else {
        await projectService.update(project.id, { name: defaultName("other", locale) });
      }
      setTimeout(() => router.push(`/projects/${project.id}/editor`), analysis ? 1500 : 200);
    } catch {
      setBusy(false);
    }
  }

  async function startFromDims() {
    setBusy(true);
    try {
      const project = await createBase("other");
      const room = await roomService.primary(project.id);
      if (room) {
        await roomService.setDimensions(
          room.id,
          {
            widthIn: toInches({ feet: dims.w, inches: 0 }),
            lengthIn: toInches({ feet: dims.l, inches: 0 }),
            heightIn: toInches({ feet: dims.h, inches: 0 }),
          },
          "manual",
        );
      }
      await projectService.update(project.id, { name: defaultName("other", locale) });
      router.push(`/projects/${project.id}/editor`);
    } catch {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-tint text-accent">
          <ScanSearch className="h-7 w-7 animate-pulse" />
        </span>
        <h1 className="mt-5 display text-2xl text-ink">{t("projects.analyze.running")}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {detected ? t("projects.start.analyzed_done") : phases[phase]}
        </p>
        {detected && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-[13px] font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {t(`common.project_type.${detected.roomType}`)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display text-[30px] leading-tight text-ink sm:text-[36px]">
        {t("projects.start.title")}
      </h1>
      <p className="mt-2 text-[15px] text-ink-soft">{t("projects.start.subtitle")}</p>

      <div className="mt-6 inline-flex rounded-full border border-line-strong bg-surface p-0.5 text-[13px] font-medium">
        <button
          onClick={() => setMode("photo")}
          className={cn(
            "rounded-full px-4 py-1.5 transition-colors",
            mode === "photo" ? "bg-ink text-white" : "text-ink-soft",
          )}
        >
          {t("projects.start.tab_photo")}
        </button>
        <button
          onClick={() => setMode("dims")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors",
            mode === "dims" ? "bg-ink text-white" : "text-ink-soft",
          )}
        >
          <Ruler className="h-3.5 w-3.5" />
          {t("projects.start.tab_dims")}
        </button>
      </div>

      <div className="mt-4">
        {mode === "photo" ? (
          <PhotoUploader onReady={startFromPhoto} />
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-ink-soft">{t("projects.start.dims_hint")}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(["w", "l", "h"] as const).map((axis) => (
                <Field
                  key={axis}
                  label={{ w: t("editor.width"), l: t("editor.length"), h: t("editor.height") }[axis]}
                >
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      className="text-center"
                      value={dims[axis]}
                      onChange={(e) => setDims({ ...dims, [axis]: Number(e.target.value) })}
                    />
                    <span className="text-xs text-muted">{t("common.unit.ft")}</span>
                  </div>
                </Field>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={startFromDims}>
              {t("projects.start.continue")}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
          <MapPin className="h-3.5 w-3.5" />
          {t("projects.start.where")}
        </p>
        <div className="mt-2.5 grid grid-cols-[1fr_140px] gap-2">
          <Input
            placeholder={t("projects.new.city")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <StateSelect value={stateCode} onChange={setStateCode} />
        </div>
        <p className="mt-2 text-[11px] text-muted">{t("projects.start.where_hint")}</p>
      </div>
    </div>
  );
}
