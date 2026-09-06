"use client";

import { useEffect, useState } from "react";
import { Check, ScanSearch, Sparkles } from "lucide-react";
import type { RoomAnalysis, RoomDimensions } from "@/types";
import { useRoomAnalysis } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { useT } from "@/components/localization/i18n-provider";
import { fromInches, toInches } from "@/lib/calculations/units";

export function AnalyzePanel({
  image,
  hint,
  onConfirm,
}: {
  image: string;
  hint: string;
  onConfirm: (analysis: RoomAnalysis, dimensions: RoomDimensions) => void;
}) {
  const t = useT();
  const { analyze, running, error } = useRoomAnalysis();
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [phase, setPhase] = useState(0);
  const [ft, setFt] = useState({ w: 12, wi: 0, l: 15, li: 0, h: 9, hi: 0 });
  const [keepS, setKeepS] = useState<Record<number, boolean>>({});
  const [keepO, setKeepO] = useState<Record<number, boolean>>({});

  const phases = [
    t("projects.analyze.phase_prepare"),
    t("projects.analyze.running"),
    t("projects.analyze.phase_segment"),
    t("projects.analyze.phase_openings"),
    t("projects.analyze.phase_furniture"),
    t("projects.analyze.phase_dimensions"),
  ];

  useEffect(() => {
    const timer = setInterval(() => setPhase((p) => (p + 1) % phases.length), 600);
    analyze(image, hint).then((r) => {
      clearInterval(timer);
      if (!r) return;
      setAnalysis(r);
      setKeepS(Object.fromEntries(r.surfaces.map((_, i) => [i, true])));
      setKeepO(Object.fromEntries(r.objects.map((_, i) => [i, true])));
      const d = r.approximateDimensions;
      if (d?.widthIn) {
        const w = fromInches(d.widthIn ?? 144), l = fromInches(d.lengthIn ?? 180), h = fromInches(d.heightIn ?? 108);
        setFt({ w: w.feet, wi: w.inches, l: l.feet, li: l.inches, h: h.feet, hi: h.inches });
      }
    });
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (running || !analysis) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[1px]" />
          <div className="scanline absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-clay/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <ScanSearch className="h-8 w-8 animate-pulse" />
            <p className="mt-3 font-serif text-xl">{t("projects.analyze.running")}</p>
            <p className="mt-1 text-sm text-white/80">{phases[phase]}</p>
          </div>
        </div>
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const dims: RoomDimensions = {
    widthIn: toInches({ feet: ft.w, inches: ft.wi }),
    lengthIn: toInches({ feet: ft.l, inches: ft.li }),
    heightIn: toInches({ feet: ft.h, inches: ft.hi }),
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" /> {t(`common.project_type.${analysis.roomType}`)} · {Math.round(analysis.confidence * 100)}%
          </div>
        </div>
        <div className="p-5">
          <p className="font-serif text-lg text-ink">{analysis.summary}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("projects.analyze.adjust_hint")}</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <ToggleList
              title={t("projects.analyze.surfaces")}
              items={analysis.surfaces.map((s) => ({ label: s.label, meta: `${Math.round(s.confidence * 100)}%` }))}
              state={keepS}
              setState={setKeepS}
            />
            <ToggleList
              title={t("projects.analyze.objects")}
              items={analysis.objects.map((o) => ({ label: o.label, meta: `${Math.round(o.confidence * 100)}%` }))}
              state={keepO}
              setState={setKeepO}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg text-ink">{t("projects.analyze.dimensions")}</p>
          <span className="rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
            {t("projects.analyze.ai_estimate")}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(["w", "l", "h"] as const).map((axis) => (
            <Field key={axis} label={{ w: t("editor.width"), l: t("editor.length"), h: t("editor.height") }[axis]}>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  className="text-center"
                  value={ft[axis]}
                  onChange={(e) => setFt({ ...ft, [axis]: Number(e.target.value) })}
                />
                <span className="text-xs text-muted">ft</span>
                <Input
                  type="number"
                  min="0"
                  max="11"
                  className="text-center"
                  value={ft[`${axis}i` as "wi" | "li" | "hi"]}
                  onChange={(e) => setFt({ ...ft, [`${axis}i`]: Number(e.target.value) })}
                />
                <span className="text-xs text-muted">in</span>
              </div>
            </Field>
          ))}
        </div>
        <PriceDisclaimer className="mt-4" text={t("projects.analyze.dimensions_disclaimer")} />
      </div>

      <Button size="lg" className="w-full" onClick={() => onConfirm(analysis, dims)}>
        <Check className="h-4 w-4" /> {t("projects.analyze.go_to_editor")}
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
