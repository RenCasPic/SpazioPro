"use client";

import { use, useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { useLiveEstimate, useScenarioTotals } from "@/hooks/use-estimate";
import { ProjectShell } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { CostRange } from "@/components/studio/cost-range";
import { LaborEditor } from "@/components/budget/labor-editor";
import { BudgetSettings } from "@/components/budget/budget-settings";
import { ScenarioComparison } from "@/components/budget/scenario-comparison";
import { ScenarioSwitcher } from "@/components/editor/scenario-switcher";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { estimateService } from "@/lib/services/estimate-service";
import { clientService } from "@/lib/services/client-service";
import { profileService } from "@/lib/services/profile-service";
import { imageService } from "@/lib/services/image-service";
import { downloadEstimatePdf } from "@/lib/services/pdf-download";
import { itemBreakdown, resolveItemQuantity } from "@/lib/calculations/estimate";
import { productById } from "@/data/catalog";
import { UNIT_KEYS } from "@/lib/constants";
import { formatUsd, formatNumber } from "@/lib/format";
import type { EstimateKind } from "@/types";
import type { ProjectBundle } from "@/lib/services/project-service";

export default function EstimatePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { bundle, load } = useEditor();

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  return (
    <ProjectShell projectId={projectId}>
      {() => (bundle ? <Estimate bundle={bundle} /> : <p className="py-10 text-center text-sm text-muted">…</p>)}
    </ProjectShell>
  );
}

function Estimate({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const locale = useLocale();
  const { setScenario, addScenario } = useEditor();
  const push = useToasts((s) => s.push);
  const [busy, setBusy] = useState<EstimateKind | null>(null);

  const dep = bundle.items.length + JSON.stringify(bundle.config) + bundle.project.activeScenarioId + bundle.project.stateCode;
  const { data: live } = useLiveEstimate(bundle.project.id, bundle.project.activeScenarioId, dep);
  const scenarioTotals = useScenarioTotals(bundle.project.id, bundle.scenarios.map((s) => s.id), dep);

  const items = activeItems(bundle);
  const room = bundle.rooms[0];
  const dims = room ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn } : { widthIn: 144, lengthIn: 180, heightIn: 108 };
  const money = (n: number) => formatUsd(n, locale);

  async function generate(kind: EstimateKind) {
    setBusy(kind);
    try {
      const estimate = await estimateService.generate(bundle.project.id, { scenarioId: bundle.project.activeScenarioId, kind });
      const [client, profile, original] = await Promise.all([
        bundle.project.clientId ? clientService.get(bundle.project.clientId) : Promise.resolve(null),
        profileService.get(),
        imageService.original(bundle.project.id),
      ]);
      await downloadEstimatePdf({ estimate, project: bundle.project, client, profile, location: bundle.location, originalImage: original });
      push(kind === "proposal" ? t("estimates.proposal.generated") : t("estimates.generated", { number: estimate.estimateNumber }), "success");
    } catch (e) {
      push(e instanceof Error ? e.message : t("estimates.generate_failed"), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[26px] text-ink">{t("editor.range.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generate("proposal")} disabled={!!busy || !items.length}>
            {busy === "proposal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t("estimates.proposal.generate")}
          </Button>
          <Button onClick={() => generate("estimate")} disabled={!!busy || !items.length}>
            {busy === "estimate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("common.actions.download_pdf")}
          </Button>
        </div>
      </div>

      <ScenarioSwitcher
        scenarios={bundle.scenarios}
        activeId={bundle.project.activeScenarioId}
        totals={Object.fromEntries(Object.entries(scenarioTotals).map(([k, v]) => [k, { total: v.total }]))}
        onSelect={setScenario}
        onAdd={(tier) => addScenario(tier)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {live && <CostRange totals={live.totals} confidence={live.confidence} className="lg:hidden" />}

          <details className="group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium text-ink">
              {t("estimates.materials_and_furniture")}
              <span className="text-xs text-muted group-open:hidden">{t("editor.range.detail")}</span>
            </summary>
          <section className="px-5 pb-5">
            <h3 className="sr-only">{t("estimates.materials_and_furniture")}</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5 font-medium">{t("estimates.table.item")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("estimates.table.quantity")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("estimates.table.price")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("estimates.table.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">
                        {t("estimates.no_items")}{" "}
                        <LocaleLink href={`/projects/${bundle.project.id}/editor`} className="text-clay underline">
                          {t("estimates.go_to_editor")}
                        </LocaleLink>
                      </td>
                    </tr>
                  )}
                  {items.map((it) => {
                    const p = productById(it.productId);
                    const b = itemBreakdown(it, dims);
                    return (
                      <tr key={it.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-ink">{it.name}</span>
                          <span className="block text-[11px] text-muted">{p?.brand} · {it.supplier ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                          {formatNumber(resolveItemQuantity(it, dims), 2, locale)} {t(UNIT_KEYS[it.unit])}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">{money(it.unitPrice + it.laborCost)}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-ink">{money(b.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          </details>

          <details className="group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-medium text-ink">
              {t("settings.advanced_mode")}
              <span className="text-xs text-muted group-open:hidden">{t("settings.advanced_hint")}</span>
            </summary>
            <div className="space-y-5 px-5 pb-5">
              <LaborEditor bundle={bundle} />
              <BudgetSettings bundle={bundle} />
            </div>
          </details>

          {bundle.scenarios.length > 1 && (
            <section>
              <h3 className="mb-3 font-serif text-xl text-ink">{t("editor.studio.compare_title")}</h3>
              <ScenarioComparison bundle={bundle} totals={scenarioTotals} onSelect={setScenario} />
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          {live ? (
            <CostRange totals={live.totals} confidence={live.confidence} className="hidden lg:block" />
          ) : (
            <div className="hidden rounded-2xl border border-line bg-surface p-5 lg:block">
              <p className="text-sm text-muted">…</p>
            </div>
          )}
          <Button
            className="mt-4 w-full"
            onClick={() => generate("estimate")}
            disabled={!!busy || !items.length}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("common.actions.download_pdf")}
          </Button>
          <PriceDisclaimer className="mt-4" />
        </aside>
      </div>
    </div>
  );
}
