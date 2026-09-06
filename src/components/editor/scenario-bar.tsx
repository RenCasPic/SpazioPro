"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import type { Project } from "@/types";
import { useEditor } from "@/lib/store";
import { totalsForScenario } from "@/lib/estimate";
import { formatCurrencyShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ScenarioBar({ project }: { project: Project }) {
  const { setScenario, addScenario } = useEditor();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <Layers className="h-4 w-4 shrink-0 text-muted" />
      {project.scenarios.map((s) => {
        const total = totalsForScenario(project, s.id).total;
        const active = project.activeScenarioId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-left transition-colors",
              active ? "border-clay bg-clay-tint" : "border-line-strong hover:border-ink/30",
            )}
          >
            <span className={cn("block text-xs font-medium", active ? "text-clay-dark" : "text-ink")}>
              {s.name}
            </span>
            <span className="block text-[11px] tabular-nums text-muted">
              {formatCurrencyShort(total)}
            </span>
          </button>
        );
      })}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addScenario(name);
            setName("");
            setAdding(false);
          }}
          className="flex shrink-0 items-center gap-1"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setAdding(false)}
            placeholder="Escenario"
            className="h-8 w-28 rounded-full border border-line-strong px-3 text-xs outline-none focus:border-clay"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-soft hover:border-ink/30"
          title="Nuevo escenario"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
