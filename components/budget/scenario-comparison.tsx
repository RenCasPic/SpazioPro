"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import type { EstimateTotals } from "@/types";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd0 } from "@/lib/format";
import { lookName } from "@/components/editor/scenario-switcher";
import { cn } from "@/lib/utils";

const ROWS: Array<{ key: "materials" | "labor" | "equipment" | "delivery" | "disposal" | "permits" | "tax" | "total"; labelKey: string }> = [
  { key: "materials", labelKey: "estimates.cost_lines.materials" },
  { key: "labor", labelKey: "estimates.cost_lines.labor" },
  { key: "equipment", labelKey: "estimates.cost_lines.equipment" },
  { key: "delivery", labelKey: "estimates.cost_lines.delivery" },
  { key: "disposal", labelKey: "estimates.cost_lines.disposal" },
  { key: "permits", labelKey: "estimates.cost_lines.permits" },
  { key: "tax", labelKey: "estimates.cost_lines.sales_tax" },
  { key: "total", labelKey: "estimates.cost_lines.grand_total" },
];

export function ScenarioComparison({
  bundle,
  totals,
  onSelect,
}: {
  bundle: ProjectBundle;
  totals: Record<string, EstimateTotals>;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const rows = ROWS.filter((r) => r.key === "total" || r.key === "materials" || r.key === "labor" || r.key === "tax" || Object.values(totals).some((v) => v[r.key] > 0));

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-muted">{t("estimates.table.item")}</th>
            {bundle.scenarios.map((s, i) => (
              <th key={s.id} className="px-4 py-3 text-right">
                <button onClick={() => onSelect(s.id)} className="inline-flex flex-col items-end">
                  <span className={cn("font-medium", s.id === bundle.project.activeScenarioId ? "text-accent" : "text-ink")}>{lookName(s, i, locale)}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={cn("border-b border-line last:border-0", row.key === "total" && "bg-canvas font-serif")}>
              <td className="px-4 py-2.5 text-ink-soft">{t(row.labelKey)}</td>
              {bundle.scenarios.map((s) => {
                const v = totals[s.id];
                return (
                  <td key={s.id} className={cn("px-4 py-2.5 text-right tabular-nums", row.key === "total" ? "text-ink" : "text-ink-soft")}>
                    {v ? formatUsd0(v[row.key], locale) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
