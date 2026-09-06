"use client";

import { useEffect, useState } from "react";
import { Check, ScanSearch, Sparkles } from "lucide-react";
import type { Dimensions, RoomType, VisionResult } from "@/types";
import { ROOM_TYPE_LABELS } from "@/types";
import { visionService } from "@/services/visionService";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PriceDisclaimer } from "@/components/ui/disclaimer";

const PHASES = [
  "Detectando perspectiva y líneas de fuga…",
  "Segmentando paredes, suelo y techo…",
  "Identificando ventanas y puertas…",
  "Reconociendo mobiliario…",
  "Estimando dimensiones del espacio…",
];

export function AnalyzePanel({
  image,
  hintRoomType,
  onConfirm,
}: {
  image: string;
  hintRoomType: RoomType;
  onConfirm: (vision: VisionResult, dimensions: Dimensions) => void;
}) {
  const [result, setResult] = useState<VisionResult | null>(null);
  const [phase, setPhase] = useState(0);
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [surfaces, setSurfaces] = useState<Record<number, boolean>>({});
  const [objects, setObjects] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 650);
    let alive = true;
    visionService.analyze(image, hintRoomType).then((r) => {
      if (!alive) return;
      setResult(r);
      setDims(r.dimensions_estimate);
      setSurfaces(Object.fromEntries(r.surfaces.map((_, i) => [i, true])));
      setObjects(Object.fromEntries(r.objects.map((_, i) => [i, true])));
      clearInterval(t);
    });
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [image, hintRoomType]);

  if (!result || !dims) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Espacio en análisis" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[1px]" />
          <div className="scanline absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-clay/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <ScanSearch className="h-8 w-8 animate-pulse" />
            <p className="mt-3 font-serif text-xl">Analizando tu espacio…</p>
            <p className="mt-1 text-sm text-white/80">{PHASES[phase]}</p>
          </div>
        </div>
      </div>
    );
  }

  const chosenSurfaces = result.surfaces.filter((_, i) => surfaces[i]);
  const chosenObjects = result.objects.filter((_, i) => objects[i]);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Espacio analizado" className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" /> {ROOM_TYPE_LABELS[result.room_type]}
          </div>
        </div>
        <div className="p-5">
          <p className="font-serif text-lg text-ink">{result.summary}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Revisa y ajusta las zonas detectadas. Podrás editarlas también dentro del editor.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Superficies
              </p>
              <div className="space-y-1.5">
                {result.surfaces.map((s, i) => (
                  <Toggle
                    key={i}
                    checked={!!surfaces[i]}
                    onChange={(v) => setSurfaces((m) => ({ ...m, [i]: v }))}
                    label={s.label}
                    meta={`${Math.round(s.confidence * 100)}%`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Mobiliario y objetos
              </p>
              <div className="space-y-1.5">
                {result.objects.map((o, i) => (
                  <Toggle
                    key={i}
                    checked={!!objects[i]}
                    onChange={(v) => setObjects((m) => ({ ...m, [i]: v }))}
                    label={o.label}
                    meta={`${Math.round(o.confidence * 100)}%`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg text-ink">Dimensiones del espacio</p>
          <span className="rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
            {dims.estimated ? "Estimación IA" : "Introducidas"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(["width", "length", "height"] as const).map((k) => (
            <Field key={k} label={{ width: "Ancho (m)", length: "Largo (m)", height: "Altura (m)" }[k]}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={dims[k]}
                onChange={(e) =>
                  setDims((d) => (d ? { ...d, [k]: Number(e.target.value), estimated: false } : d))
                }
              />
            </Field>
          ))}
        </div>
        <PriceDisclaimer className="mt-4" />
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() =>
          onConfirm({ ...result, surfaces: chosenSurfaces, objects: chosenObjects }, dims)
        }
      >
        <Check className="h-4 w-4" /> Ir al editor
      </Button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  meta,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-left text-sm transition-colors hover:border-ink/20"
    >
      <span className="flex items-center gap-2.5">
        <span
          className={`grid h-4 w-4 place-items-center rounded-[5px] border ${
            checked ? "border-clay bg-clay text-white" : "border-line-strong"
          }`}
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        <span className="text-ink">{label}</span>
      </span>
      {meta && <span className="text-xs text-muted">{meta}</span>}
    </button>
  );
}
