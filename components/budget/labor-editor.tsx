"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import type { Unit } from "@/types";
import { UNIT_LABELS } from "@/lib/constants";
import { useEditor } from "@/hooks/use-editor";
import { currencyService } from "@/lib/market/currency-service";

const UNITS: Unit[] = ["m2", "ml", "m3", "ud", "h", "day", "global"];

export function LaborEditor({ bundle }: { bundle: ProjectBundle }) {
  const { updateLaborLine, addLaborLine, removeLaborLine } = useEditor();
  const money = (n: number) =>
    currencyService.format({ amount: n, currency: bundle.project.currencyCode }, bundle.project.locale);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-ink">Mano de obra</h3>
        <button
          onClick={addLaborLine}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-medium text-ink hover:border-ink/30"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir partida
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        Tarifas prellenadas desde el mercado de {bundle.project.countryCode}. Ajusta cantidades y precios.
      </p>

      <div className="mt-3 space-y-2">
        {bundle.config.laborLines.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-line p-2.5 sm:grid-cols-[auto_1fr_5rem_6rem_7rem_6rem_auto]"
          >
            <input
              type="checkbox"
              checked={l.enabled}
              onChange={(e) => updateLaborLine(l.id, { enabled: e.target.checked })}
              className="h-4 w-4 accent-clay"
            />
            <input
              defaultValue={l.label}
              key={l.label}
              onBlur={(e) => updateLaborLine(l.id, { label: e.target.value })}
              className="h-8 rounded-lg bg-transparent px-1.5 text-sm text-ink outline-none hover:bg-paper focus:bg-paper"
            />
            <select
              value={l.unit}
              onChange={(e) => updateLaborLine(l.id, { unit: e.target.value as Unit })}
              className="hidden h-8 rounded-lg border border-line-strong bg-surface px-1.5 text-xs sm:block"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.5"
              defaultValue={l.quantity}
              key={l.quantity}
              onBlur={(e) => updateLaborLine(l.id, { quantity: Number(e.target.value) })}
              className="hidden h-8 rounded-lg border border-line-strong px-2 text-right text-xs sm:block"
            />
            <input
              type="number"
              min="0"
              step="1"
              defaultValue={l.unitCost}
              key={l.unitCost}
              onBlur={(e) => updateLaborLine(l.id, { unitCost: Number(e.target.value), fromMarket: false })}
              className="hidden h-8 rounded-lg border border-line-strong px-2 text-right text-xs sm:block"
            />
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-24 text-right text-sm font-medium tabular-nums text-ink">
                {money(l.quantity * l.unitCost)}
              </span>
              <button onClick={() => removeLaborLine(l.id)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
