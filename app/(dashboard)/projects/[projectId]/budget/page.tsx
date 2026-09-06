"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileCheck2, Loader2 } from "lucide-react";
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
import { useToasts } from "@/lib/toast";
import { estimateService } from "@/lib/services/estimate-service";
import { clientService } from "@/lib/services/client-service";
import { profileService } from "@/lib/services/profile-service";
import { imageService } from "@/lib/services/image-service";
import { downloadEstimatePdf } from "@/lib/services/pdf-download";
import { currencyService } from "@/lib/market/currency-service";
import { itemBreakdown, resolveItemQuantity } from "@/lib/calculations/estimate";
import { productById } from "@/data/catalog";
import { UNIT_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { ProjectBundle } from "@/lib/services/project-service";

export default function BudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { bundle, load } = useEditor();

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  return (
    <ProjectShell projectId={projectId}>
      {() =>
        bundle ? <Budget bundle={bundle} /> : <p className="py-10 text-center text-sm text-muted">Cargando presupuesto…</p>
      }
    </ProjectShell>
  );
}

function Budget({ bundle }: { bundle: ProjectBundle }) {
  const { setScenario, addScenario } = useEditor();
  const push = useToasts((s) => s.push);
  const [generating, setGenerating] = useState(false);

  const dep = bundle.items.length + JSON.stringify(bundle.config) + bundle.project.activeScenarioId + bundle.project.countryCode;
  const { data: live } = useLiveEstimate(bundle.project.id, bundle.project.activeScenarioId, dep);
  const scenarioTotals = useScenarioTotals(bundle.project.id, bundle.scenarios.map((s) => s.id), dep);

  const items = activeItems(bundle);
  const room = bundle.rooms[0];
  const dims = room ? { width: room.width, length: room.length, height: room.height } : { width: 4, length: 5, height: 2.6 };
  const money = (n: number) =>
    currencyService.format({ amount: n, currency: bundle.project.currencyCode }, bundle.project.locale);

  async function generate() {
    setGenerating(true);
    try {
      const estimate = await estimateService.generate(bundle.project.id, bundle.project.activeScenarioId);
      const [client, profile, original] = await Promise.all([
        bundle.project.clientId ? clientService.get(bundle.project.clientId) : Promise.resolve(null),
        profileService.get(),
        imageService.original(bundle.project.id),
      ]);
      await downloadEstimatePdf({ estimate, project: bundle.project, client, profile, originalImage: original });
      push(`Presupuesto ${estimate.estimateNumber} generado y descargado.`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo generar el presupuesto.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Presupuesto</h2>
        <Button onClick={generate} disabled={generating || !items.length}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
          Generar presupuesto PDF
        </Button>
      </div>

      <ScenarioSwitcher
        scenarios={bundle.scenarios}
        activeId={bundle.project.activeScenarioId}
        totals={Object.fromEntries(
          Object.entries(scenarioTotals).map(([k, v]) => [k, { total: v.total, currency: v.currency }]),
        )}
        onSelect={setScenario}
        onAdd={(tier) => addScenario(tier)}
        locale={bundle.project.locale}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h3 className="font-serif text-xl text-ink">Materiales y mobiliario</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5 font-medium">Concepto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cantidad</th>
                    <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">
                        Este escenario no tiene elementos.{" "}
                        <Link href={`/projects/${bundle.project.id}/editor`} className="text-clay underline">
                          Ir al editor
                        </Link>
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
                          <span className="block text-[11px] text-muted">
                            {p?.brand} · {it.supplier ?? "—"}
                            {it.priceSource === "converted" && " · precio de referencia"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                          {formatNumber(resolveItemQuantity(it, dims))} {UNIT_LABELS[it.unit]}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                          {money(it.unitPrice + it.laborCost)}
                        </td>
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
            <h3 className="mb-3 font-serif text-xl text-ink">Comparar escenarios</h3>
            <ScenarioComparison bundle={bundle} totals={scenarioTotals} onSelect={setScenario} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <h3 className="font-serif text-lg text-ink">Resumen</h3>
            {live ? (
              <>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="Materiales" value={money(live.totals.materials)} />
                  <Row label="Mano de obra" value={money(live.totals.labor)} />
                  <Row label="Transporte" value={money(live.totals.transport)} />
                  <Row label="Subtotal" value={money(live.totals.subtotal)} strong />
                  {live.totals.discount > 0 && <Row label="Descuento" value={`−${money(live.totals.discount)}`} />}
                  <Row label={`Impuestos ${bundle.config.settings.vatRate}%`} value={money(live.totals.tax)} />
                  <div className="flex items-baseline justify-between border-t border-line pt-2">
                    <dt className="font-serif text-base text-ink">TOTAL</dt>
                    <dd className="font-serif text-xl text-clay tabular-nums">{money(live.totals.total)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <ConfidencePill report={live.confidence} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Calculando…</p>
            )}
            <Button className="mt-4 w-full" onClick={generate} disabled={generating || !items.length}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar PDF
            </Button>
          </div>
          <PriceDisclaimer className="mt-4" />
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? "font-medium text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-medium text-ink" : "text-ink-soft"}`}>{value}</dd>
    </div>
  );
}
