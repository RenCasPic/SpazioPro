"use client";

import { use, useEffect } from "react";
import { Check, Pencil } from "lucide-react";
import { useEditor } from "@/hooks/use-editor";
import { useScenarioTotals } from "@/hooks/use-estimate";
import { ProjectShell } from "@/components/projects/project-shell";
import { ScenarioSwitcher } from "@/components/editor/scenario-switcher";
import { ScenarioComparison } from "@/components/budget/scenario-comparison";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd } from "@/lib/format";
import type { ProjectBundle } from "@/lib/services/project-service";
import { cn } from "@/lib/utils";

export default function ScenariosPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { bundle, load } = useEditor();

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  return (
    <ProjectShell projectId={projectId}>
      {() => (bundle ? <Scenarios bundle={bundle} /> : <p className="py-10 text-center text-sm text-muted">…</p>)}
    </ProjectShell>
  );
}

function Scenarios({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { setScenario, addScenario } = useEditor();
  const dep = bundle.items.length + JSON.stringify(bundle.config) + bundle.project.stateCode;
  const totals = useScenarioTotals(bundle.project.id, bundle.scenarios.map((s) => s.id), dep);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-ink">{t("projects.tabs.scenarios")}</h2>
      </div>

      <ScenarioSwitcher
        scenarios={bundle.scenarios}
        activeId={bundle.project.activeScenarioId}
        totals={Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, { total: v.total }]))}
        onSelect={setScenario}
        onAdd={(tier) => addScenario(tier)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {bundle.scenarios.map((s) => {
          const total = totals[s.id]?.total;
          const active = s.id === bundle.project.activeScenarioId;
          const count = bundle.items.filter((i) => i.scenarioId === s.id).length;
          return (
            <div key={s.id} className={cn("rounded-2xl border bg-surface p-5", active ? "border-clay shadow-[var(--shadow-card)]" : "border-line")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">{s.name}</span>
                {s.type === "standard" && <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-medium text-sage">{t("estimates.recommended")}</span>}
              </div>
              <p className="mt-2 font-serif text-2xl text-ink">{total != null ? formatUsd(total, locale) : "—"}</p>
              <p className="mt-1 text-xs text-muted">{count} item(s)</p>
              <div className="mt-4 flex gap-2">
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <button onClick={() => setScenario(s.id)} className="rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-medium hover:border-ink/30">
                    {t("common.actions.apply")}
                  </button>
                )}
                <LocaleLink href={`/projects/${bundle.project.id}/editor`} className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-medium hover:border-ink/30">
                  <Pencil className="h-3 w-3" /> {t("common.actions.edit")}
                </LocaleLink>
              </div>
            </div>
          );
        })}
      </div>

      <ScenarioComparison bundle={bundle} totals={totals} onSelect={setScenario} />
      <PriceDisclaimer />
    </div>
  );
}
