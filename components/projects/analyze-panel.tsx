"use client";

import { useEffect, useState } from "react";
import { Check, ScanSearch, Sparkles } from "lucide-react";
import type { RoomAnalysis, RoomDimensions } from "@/types";
import { PROJECT_TYPE_LABELS } from "@/types";
import { useRoomAnalysis } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PriceDisclaimer } from "@/components/ui/disclaimer";

const PHASES = [
  "Preparando…",
  "Analizando tu espacio…",
  "Segmentando paredes, suelo y techo…",
  "Identificando ventanas y puertas…",
  "Reconociendo mobiliario…",
  "Estimando dimensiones…",
];

export function AnalyzePanel({
  image,
  hint,
  onConfirm,
}: {
  image: string;
  hint: string;
  onConfirm: (analysis: RoomAnalysis, dimensions: RoomDimensions) => void;
}) {
  const { analyze, running, error } = useRoomAnalysis();
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [phase, setPhase] = useState(0);
  const [dims, setDims] = useState<RoomDimensions>({ width: 4, length: 5, height: 2.6 });
  const [keepSurfaces, setKeepSurfaces] = useState<Record<number, boolean>>({});
  const [keepObjects, setKeepObjects] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 600);
    analyze(image, hint).then((r) => {
      clearInterval(t);
      if (!r) return;
      setAnalysis(r);
      setKeepSurfaces(Object.fromEntries(r.surfaces.map((_, i) => [i, true])));
      setKeepObjects(Object.fromEntries(r.objects.map((_, i) => [i, true])));
      if (r.approximateDimensions?.width) {
        setDims({
          width: r.approximateDimensions.width ?? 4,
          length: r.approximateDimensions.length ?? 5,
          height: r.approximateDimensions.height ?? 2.6,
        });
      }
    });
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (running || !analysis) {
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
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Espacio analizado" className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" /> {PROJECT_TYPE_LABELS[analysis.roomType]} ·{" "}
            {Math.round(analysis.confidence * 100)}%
          </div>
        </div>
        <div className="p-5">
          <p className="font-serif text-lg text-ink">{analysis.summary}</p>
          <p className="mt-1 text-sm text-ink-soft">Ajusta lo que quieras conservar; podrás editarlo también en el editor.</p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <ToggleList
              title="Superficies"
              items={analysis.surfaces.map((s) => ({ label: s.label, meta: `${Math.round(s.confidence * 100)}%` }))}
              state={keepSurfaces}
              setState={setKeepSurfaces}
            />
            <ToggleList
              title="Mobiliario y objetos"
              items={analysis.objects.map((o) => ({ label: o.label, meta: `${Math.round(o.confidence * 100)}%` }))}
              state={keepObjects}
              setState={setKeepObjects}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg text-ink">Dimensiones del espacio</p>
          <span className="rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
            Estimación aproximada por IA
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
                onChange={(e) => setDims((d) => ({ ...d, [k]: Number(e.target.value) }))}
              />
            </Field>
          ))}
        </div>
        <PriceDisclaimer
          className="mt-4"
          text="Las dimensiones estimadas por IA no son una medición certificada. Introduce las medidas reales cuando las tengas para afinar el presupuesto."
        />
      </div>

      <Button size="lg" className="w-full" onClick={() => onConfirm(analysis, dims)}>
        <Check className="h-4 w-4" /> Ir al editor
      </Button>
    </div>
  );
}

function ToggleList({
  title,
  items,
  state,
  setState,
}: {
  title: string;
  items: { label: string; meta: string }[];
  state: Record<number, boolean>;
  setState: (fn: (s: Record<number, boolean>) => Record<number, boolean>) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setState((s) => ({ ...s, [i]: !s[i] }))}
            className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-left text-sm hover:border-ink/20"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`grid h-4 w-4 place-items-center rounded-[5px] border ${
                  state[i] ? "border-clay bg-clay text-white" : "border-line-strong"
                }`}
              >
                {state[i] && <Check className="h-3 w-3" />}
              </span>
              <span className="text-ink">{item.label}</span>
            </span>
            <span className="text-xs text-muted">{item.meta}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
