"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Project, Unit } from "@/types";
import { UNIT_LABELS } from "@/types";
import { useEditor } from "@/lib/store";
import { formatCurrency } from "@/lib/format";

const UNITS: Unit[] = ["m2", "ml", "ud", "h", "global"];

export function LaborEditor({ project }: { project: Project }) {
  const { updateLabor, addLabor, removeLabor } = useEditor();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-ink">Mano de obra</h3>
        <button
          onClick={addLabor}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-medium text-ink hover:border-ink/30"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir partida
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {project.labor.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-line p-2.5 sm:grid-cols-[auto_1fr_5rem_7rem_6rem_auto]"
          >
            <input
              type="checkbox"
              checked={l.enabled}
              onChange={(e) => updateLabor(l.id, { enabled: e.target.checked })}
              className="h-4 w-4 accent-clay"
            />
            <input
              value={l.label}
              onChange={(e) => updateLabor(l.id, { label: e.target.value })}
              className="h-8 rounded-lg bg-transparent px-1.5 text-sm text-ink outline-none hover:bg-paper focus:bg-paper"
            />
            <select
              value={l.unit}
              onChange={(e) => updateLabor(l.id, { unit: e.target.value as Unit })}
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
              value={l.quantity}
              onChange={(e) => updateLabor(l.id, { quantity: Number(e.target.value) })}
              className="hidden h-8 rounded-lg border border-line-strong px-2 text-right text-xs sm:block"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={l.price}
              onChange={(e) => updateLabor(l.id, { price: Number(e.target.value) })}
              className="hidden h-8 rounded-lg border border-line-strong px-2 text-right text-xs sm:block"
            />
            <div className="flex items-center gap-1.5">
              <span className="w-20 text-right text-sm font-medium tabular-nums text-ink">
                {formatCurrency(l.quantity * l.price)}
              </span>
              <button
                onClick={() => removeLabor(l.id)}
                className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
