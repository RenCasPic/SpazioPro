"use client";

import { Plus, Sparkles } from "lucide-react";
import type { DesignScenario, ScenarioType } from "@/types";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd0 } from "@/lib/format";
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

  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
      <Sparkles className="h-4 w-4 shrink-0 text-muted" />
      <span className="mr-0.5 shrink-0 text-xs font-medium text-muted">{t("editor.studio.looks")}</span>
      {scenarios.map((s, i) => {
        const total = totals[s.id]?.total;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-left transition-colors",
              active ? "border-accent bg-accent-tint" : "border-line-strong hover:border-ink/30",
            )}
          >
            <span className={cn("block text-xs font-medium", active ? "text-accent" : "text-ink")}>
              {lookName(s, i, locale)}
            </span>
            <span className="block text-[11px] tabular-nums text-muted">
              {total ? formatUsd0(total, locale) : ""}
            </span>
          </button>
        );
      })}
      {onAdd && (
        <button
          onClick={() => onAdd("custom")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-soft hover:border-ink/30"
          title={t("editor.studio.new_look")}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Consumer-friendly label — hides the internal Economy/Standard/Premium tiers. */
function lookName(s: DesignScenario, i: number, locale: string): string {
  const seeded = ["Economy", "Standard", "Premium", "Custom"].includes(s.name);
  if (!seeded) return s.name;
  return (locale === "es-US" ? "Estilo " : "Look ") + (i + 1);
}
