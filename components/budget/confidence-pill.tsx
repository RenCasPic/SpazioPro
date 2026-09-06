"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from "lucide-react";
import type { ConfidenceReport } from "@/types";
import { useT } from "@/components/localization/i18n-provider";
import { cn } from "@/lib/utils";

const META = {
  high: { key: "high", icon: ShieldCheck, cls: "bg-sage/15 text-sage" },
  medium: { key: "medium", icon: ShieldAlert, cls: "bg-gold/15 text-gold" },
  low: { key: "low", icon: ShieldX, cls: "bg-red-100 text-red-700" },
};

export function ConfidencePill({ report }: { report: ConfidenceReport }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const m = META[report.level];

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", m.cls)}>
        <m.icon className="h-3.5 w-3.5" />
        {t(`common.confidence.${m.key}`)}
        {report.reasons.length > 0 && (
          <>
            · {report.reasons.length}
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && report.reasons.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-xl bg-paper p-3 text-xs text-ink-soft">
          {report.reasons.map((r) => (
            <li key={r} className="flex gap-1.5">
              <span className="text-clay">•</span>
              {t(`estimates.confidence_reasons.${r}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
