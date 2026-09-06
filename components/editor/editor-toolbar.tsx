"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Undo2, Redo2, FileText, Columns2, Check, Loader2, Globe } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { useScenarioTotals } from "@/hooks/use-estimate";
import { ScenarioSwitcher } from "./scenario-switcher";
import { ChangeCountryDialog } from "@/components/projects/change-country-dialog";
import { projectService } from "@/lib/services/project-service";
import { Logo } from "@/components/brand/logo";
import { countryByCode } from "@/lib/market/data/countries";

export function EditorToolbar({ bundle }: { bundle: ProjectBundle }) {
  const { past, future, undo, redo, setScenario, addScenario, reload } = useEditor();
  const [name, setName] = useState(bundle.project.name);
  const [saved, setSaved] = useState(true);
  const [countryOpen, setCountryOpen] = useState(false);
  const country = countryByCode(bundle.project.countryCode);

  const totals = useScenarioTotals(
    bundle.project.id,
    bundle.scenarios.map((s) => s.id),
    bundle.items.length + JSON.stringify(bundle.config),
  );

  useEffect(() => setName(bundle.project.name), [bundle.project.name]);

  async function commitName() {
    if (name.trim() && name !== bundle.project.name) {
      setSaved(false);
      await projectService.update(bundle.project.id, { name: name.trim() });
      await reload();
      setSaved(true);
    }
  }

  return (
    <header className="z-30 flex flex-col gap-2 border-b border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Link
          href={`/projects/${bundle.project.id}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
          title="Volver al proyecto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="hidden sm:block">
          <Logo href="/dashboard" size="sm" />
        </div>
        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 font-serif text-base text-ink outline-none hover:bg-paper focus:bg-paper"
        />

        <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 text-sage" /> Guardado
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
            </>
          )}
        </span>

        <button
          onClick={() => setCountryOpen(true)}
          className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex"
          title="Cambiar país / mercado"
        >
          <Globe className="h-4 w-4" /> {country?.flag} {bundle.project.currencyCode}
        </button>

        <div className="flex items-center gap-0.5">
          <button onClick={undo} disabled={!past.length} title="Deshacer" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={!future.length} title="Rehacer" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <Link
          href={`/projects/${bundle.project.id}/images`}
          className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex"
        >
          <Columns2 className="h-4 w-4" /> Antes / Después
        </Link>
        <Link
          href={`/projects/${bundle.project.id}/budget`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-clay px-3.5 text-[13px] font-medium text-white hover:bg-clay-dark"
        >
          <FileText className="h-4 w-4" /> Presupuesto
        </Link>
      </div>

      <ScenarioSwitcher
        scenarios={bundle.scenarios}
        activeId={bundle.project.activeScenarioId}
        totals={Object.fromEntries(
          Object.entries(totals).map(([k, v]) => [k, { total: v.total, currency: v.currency }]),
        )}
        onSelect={setScenario}
        onAdd={(tier) => addScenario(tier)}
        locale={bundle.project.locale}
      />

      <ChangeCountryDialog
        open={countryOpen}
        onClose={() => setCountryOpen(false)}
        bundle={bundle}
      />
    </header>
  );
}
