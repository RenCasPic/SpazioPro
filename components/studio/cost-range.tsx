"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { ConfidenceReport, EstimateTotals } from "@/types";
import { costRange } from "@/lib/calculations/range";
import { formatUsd0, formatUsdRange } from "@/lib/format";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { cn } from "@/lib/utils";

interface Props {
  totals: EstimateTotals;
  confidence: ConfidenceReport;
  className?: string;
}

/**
 * Consumer-facing cost view: a rounded range (never false precision), a
 * plain-language confidence line, and four grouped bars. The itemized
 * breakdown stays one tap away for anyone who wants it.
 */
export function CostRange({ totals, confidence, className }: Props) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const range = costRange(totals.total, confidence.level);
  const groups = [
    { key: "materials", value: totals.materials },
    { key: "labor", value: totals.labor },
    { key: "demo", value: totals.disposal },
    {
      key: "other",
      value:
        totals.equipment + totals.delivery + totals.permits + totals.other + totals.tax,
    },
  ].filter((g) => g.value > 0);
  const max = Math.max(1, ...groups.map((g) => g.value));

  const levelLabel = t(`common.confidence.${confidence.level}_label`);
  const toneCls =
    confidence.level === "high"
      ? "text-ok"
      : confidence.level === "medium"
        ? "text-warn"
        : "text-info";

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5", className)}>
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
        {t("editor.range.title")}
      </p>
      <p className="mt-1.5 display text-[30px] leading-tight text-ink sm:text-[34px]">
        {range.low > 0 ? formatUsdRange(range.low, range.high, locale) : formatUsd0(0, locale)}
      </p>
      <p className={cn("mt-1 text-[13px] font-medium", toneCls)}>
        {t("editor.range.confidence", { level: levelLabel })}
      </p>

      <div className="mt-4 space-y-2.5">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-ink-soft">{t(`editor.range.${g.key}`)}</span>
              <span className="tabular-nums font-medium text-ink">
                {formatUsd0(g.value, locale)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-accent/70"
                style={{ width: `${Math.max(4, (g.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 flex gap-1.5 text-[12px] leading-relaxed text-muted">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        {t("editor.range.planning_note")}
      </p>

      {confidence.reasons.length > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent"
          >
            {t("editor.range.why")}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <ul className="mt-2 space-y-1 rounded-xl bg-canvas p-3 text-[12px] text-ink-soft">
              {confidence.reasons.map((r) => (
                <li key={r} className="flex gap-1.5">
                  <span className="text-accent">•</span>
                  {t(`estimates.confidence_reasons.${r}`)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
