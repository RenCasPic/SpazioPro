"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import type { DesignScenario, ScenarioType } from "@/types";
import { SCENARIO_LABELS } from "@/types";
import { currencyService } from "@/lib/market/currency-service";
import { cn } from "@/lib/utils";

export function ScenarioSwitcher({
  scenarios,
  activeId,
  totals,
  onSelect,
  onAdd,
  locale,
}: {
  scenarios: DesignScenario[];
  activeId: string;
  totals: Record<string, { total: number; currency: string }>;
  onSelect: (id: string) => void;
  onAdd?: (tier: ScenarioType) => void;
  locale?: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
      <Layers className="h-4 w-4 shrink-0 text-muted" />
      {scenarios.map((s) => {
        const t = totals[s.id];
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-left transition-colors",
              active ? "border-clay bg-clay-tint" : "border-line-strong hover:border-ink/30",
            )}
          >
            <span className={cn("block text-xs font-medium", active ? "text-clay-dark" : "text-ink")}>
              {s.name}
            </span>
            <span className="block text-[11px] tabular-nums text-muted">
              {t
                ? currencyService.format({ amount: t.total, currency: t.currency as never }, locale)
                : SCENARIO_LABELS[s.type]}
            </span>
          </button>
        );
      })}
      {onAdd &&
        (adding ? (
          <span className="flex shrink-0 gap-1">
            {(["economy", "standard", "premium", "custom"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  onAdd(tier);
                  setAdding(false);
                }}
                className="rounded-full border border-line-strong px-2 py-1 text-[11px] hover:border-ink/30"
              >
                {SCENARIO_LABELS[tier]}
              </button>
            ))}
          </span>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-soft hover:border-ink/30"
            title="Duplicar en un escenario nuevo"
          >
            <Plus className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}
