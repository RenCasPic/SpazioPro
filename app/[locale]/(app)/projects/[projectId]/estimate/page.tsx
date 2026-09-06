"use client";

import { use, useEffect, useState } from "react";
import { Download, FileCheck2, FileText, Loader2 } from "lucide-react";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { useLiveEstimate, useScenarioTotals } from "@/hooks/use-estimate";
import { ProjectShell } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { ConfidencePill } from "@/components/budget/confidence-pill";
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

  const CL = (k: string) => t(`estimates.cost_lines.${k}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">{t("estimates.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generate("proposal")} disabled={!!busy || !items.length}>
            {busy === "proposal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t("estimates.proposal.generate")}
          </Button>
          <Button onClick={() => generate("estimate")} disabled={!!busy || !items.length}>
            {busy === "estimate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
            {t("estimates.generate")}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h3 className="font-serif text-xl text-ink">{t("estimates.materials_and_furniture")}</h3>
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

          <section className="rounded-2xl border border-line bg-surface p-5">
            <LaborEditor bundle={bundle} />
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <BudgetSettings bundle={bundle} />
          </section>

          <section>
            <h3 className="mb-3 font-serif text-xl text-ink">{t("estimates.compare_scenarios")}</h3>
            <ScenarioComparison bundle={bundle} totals={scenarioTotals} onSelect={setScenario} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <h3 className="font-serif text-lg text-ink">{t("estimates.summary")}</h3>
            {live ? (
              <>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Line label={CL("materials")} value={money(live.totals.materials)} />
                  <Line label={CL("labor")} value={money(live.totals.labor)} />
                  {live.totals.equipment > 0 && <Line label={CL("equipment")} value={money(live.totals.equipment)} />}
                  {live.totals.delivery > 0 && <Line label={CL("delivery")} value={money(live.totals.delivery)} />}
                  {live.totals.disposal > 0 && <Line label={CL("disposal")} value={money(live.totals.disposal)} />}
                  {live.totals.permits > 0 && <Line label={CL("permits")} value={money(live.totals.permits)} />}
                  {live.totals.other > 0 && <Line label={CL("other")} value={money(live.totals.other)} />}
                  <Line label={CL("subtotal")} value={money(live.totals.subtotal)} strong />
                  {live.totals.discount > 0 && <Line label={CL("discount")} value={`−${money(live.totals.discount)}`} />}
                  <Line label={`${CL("sales_tax")} ${bundle.config.settings.salesTaxRate}%`} value={money(live.totals.tax)} />
                  <div className="flex items-baseline justify-between border-t border-line pt-2">
                    <dt className="font-serif text-base text-ink">{CL("grand_total")}</dt>
                    <dd className="font-serif text-xl text-clay tabular-nums">{money(live.totals.total)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <ConfidencePill report={live.confidence} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">…</p>
            )}
            <Button className="mt-4 w-full" onClick={() => generate("estimate")} disabled={!!busy || !items.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("common.actions.download_pdf")}
            </Button>
          </div>
          <PriceDisclaimer className="mt-4" />
        </aside>
      </div>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? "font-medium text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-medium text-ink" : "text-ink-soft"}`}>{value}</dd>
    </div>
  );
}
