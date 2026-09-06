"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import type { DesignScenario, ScenarioType } from "@/types";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ScenarioSwitcher({
  scenarios,
  activeId,
  totals,
  onSelect,
  onAdd,
}: {
  scenarios: DesignScenario[];
  activeId: string;
  totals: Record<string, { total: number }>;
  onSelect: (id: string) => void;
  onAdd?: (tier: ScenarioType) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [adding, setAdding] = useState(false);

  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
      <Layers className="h-4 w-4 shrink-0 text-muted" />
      {scenarios.map((s) => {
        const total = totals[s.id]?.total;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-left transition-colors", active ? "border-clay bg-clay-tint" : "border-line-strong hover:border-ink/30")}
          >
            <span className={cn("block text-xs font-medium", active ? "text-clay-dark" : "text-ink")}>{s.name}</span>
            <span className="block text-[11px] tabular-nums text-muted">{total != null ? formatUsd(total, locale) : ""}</span>
          </button>
        );
      })}
      {onAdd &&
        (adding ? (
          <span className="flex shrink-0 gap-1">
            {(["economy", "standard", "premium"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  onAdd(tier);
                  setAdding(false);
                }}
                className="rounded-full border border-line-strong px-2 py-1 text-[11px] hover:border-ink/30"
              >
                {tier === "economy" ? "Economy" : tier === "premium" ? "Premium" : "Standard"}
              </button>
            ))}
          </span>
        ) : (
          <button onClick={() => setAdding(true)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-soft hover:border-ink/30" title={t("common.actions.add")}>
            <Plus className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}
