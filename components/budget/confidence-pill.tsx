"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from "lucide-react";
import type { ConfidenceReport } from "@/types";
import { cn } from "@/lib/utils";

const META = {
  high: { label: "Confianza alta", icon: ShieldCheck, cls: "bg-sage/15 text-sage" },
  medium: { label: "Confianza media", icon: ShieldAlert, cls: "bg-gold/15 text-gold" },
  low: { label: "Confianza baja", icon: ShieldX, cls: "bg-red-100 text-red-700" },
};

export function ConfidencePill({ report }: { report: ConfidenceReport }) {
  const [open, setOpen] = useState(false);
  const m = META[report.level];

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
          m.cls,
        )}
      >
        <m.icon className="h-3.5 w-3.5" />
        {m.label}
        {report.warnings.length > 0 && (
          <>
            · {report.warnings.length}
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && report.warnings.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-xl bg-paper p-3 text-xs text-ink-soft">
          {report.warnings.map((w, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-clay">•</span>
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
