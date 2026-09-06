"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import type { EstimateTotals } from "@/types";
import { SCENARIO_LABELS } from "@/types";
import { currencyService } from "@/lib/market/currency-service";
import { cn } from "@/lib/utils";

const ROWS: Array<{ key: "materials" | "labor" | "transport" | "tax" | "total"; label: string }> = [
  { key: "materials", label: "Materiales" },
  { key: "labor", label: "Mano de obra" },
  { key: "transport", label: "Transporte" },
  { key: "tax", label: "Impuestos" },
  { key: "total", label: "Total" },
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
  const money = (n: number) =>
    currencyService.format({ amount: n, currency: bundle.project.currencyCode }, bundle.project.locale);
  const recommended = bundle.scenarios.find((s) => s.type === "standard")?.id;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-muted">Concepto</th>
            {bundle.scenarios.map((s) => (
              <th key={s.id} className="px-4 py-3 text-right">
                <button onClick={() => onSelect(s.id)} className="inline-flex flex-col items-end">
                  <span className={cn("font-medium", s.id === bundle.project.activeScenarioId ? "text-clay-dark" : "text-ink")}>
                    {s.name}
                  </span>
                  <span className="text-[10px] font-normal text-muted">
                    {SCENARIO_LABELS[s.type]}
                    {s.id === recommended && " · recomendado"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className={cn("border-b border-line last:border-0", row.key === "total" && "bg-paper font-serif")}>
              <td className="px-4 py-2.5 text-ink-soft">{row.label}</td>
              {bundle.scenarios.map((s) => {
                const t = totals[s.id];
                return (
                  <td key={s.id} className={cn("px-4 py-2.5 text-right tabular-nums", row.key === "total" ? "text-ink" : "text-ink-soft")}>
                    {t ? money(t[row.key]) : "—"}
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
