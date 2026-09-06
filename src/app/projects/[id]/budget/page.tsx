"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Columns2, Loader2 } from "lucide-react";
import { UNIT_LABELS } from "@/types";
import { useEditor, activeItems } from "@/lib/store";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { LaborEditor } from "@/components/budget/labor-editor";
import { ScenarioBar } from "@/components/editor/scenario-bar";
import { Toaster } from "@/components/ui/toaster";
import { useToasts } from "@/lib/toast";
import { productById } from "@/data/catalog";
import { itemQuantity, itemMaterialSubtotal, itemLaborSubtotal } from "@/lib/calc";
import { activeTotals, totalsForScenario } from "@/lib/estimate";
import { formatCurrency, formatCurrencyShort, formatNumber } from "@/lib/format";
import { pdfService } from "@/services/pdfService";

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, status, load, updateSettings, setStatus } = useEditor();
  const push = useToasts((s) => s.push);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void load(id);
  }, [id, load]);

  if (!project) {
    return (
      <div className="grid h-screen place-items-center text-sm text-ink-soft">
        {status === "missing" ? (
          <Link href="/dashboard" className="text-clay underline">
            Proyecto no encontrado — volver
          </Link>
        ) : (
          "Cargando…"
        )}
      </div>
    );
  }

  const items = activeItems(project);
  const totals = activeTotals(project);

  async function exportPdf() {
    if (!project) return;
    setExporting(true);
    try {
      await pdfService.generate(project);
      setStatus(project.status === "finished" ? "finished" : "estimated");
      push("Presupuesto PDF generado.", "success");
    } catch {
      push("No se pudo generar el PDF.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${id}/editor`}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Logo href="/dashboard" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${id}/compare`}
              className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex"
            >
              <Columns2 className="h-4 w-4" /> Antes / Después
            </Link>
            <Button size="sm" onClick={exportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar presupuesto PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="font-serif text-3xl tracking-tight text-ink">Presupuesto</h1>
        <p className="mt-1 text-sm text-ink-soft">{project.name}</p>

        <div className="mt-4">
          <ScenarioBar project={project} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* materials table */}
            <section>
              <h2 className="font-serif text-xl text-ink">Materiales y mobiliario</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full min-w-[520px] text-sm">
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
                          Este escenario no tiene elementos todavía.{" "}
                          <Link href={`/projects/${id}/editor`} className="text-clay underline">
                            Ir al editor
                          </Link>
                        </td>
                      </tr>
                    )}
                    {items.map((it) => {
                      const p = productById(it.productId);
                      const qty = itemQuantity(it, project.dimensions);
                      const total =
                        itemMaterialSubtotal(it, project.dimensions) +
                        itemLaborSubtotal(it, project.dimensions);
                      return (
                        <tr key={it.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-ink">{it.name}</span>
                            <span className="block text-[11px] text-muted">
                              {it.brand} · {p?.reference}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                            {formatNumber(qty)} {UNIT_LABELS[it.unit]}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                            {formatCurrency(it.unitPrice + it.laborPrice)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums text-ink">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">
                El precio mostrado incluye material y mano de obra por unidad. Edita cantidades y
                precios de cada elemento desde el editor.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <LaborEditor project={project} />
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-serif text-xl text-ink">Ajustes del presupuesto</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="IVA (%)">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={project.settings.vatPct}
                    onChange={(e) => updateSettings({ vatPct: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Descuento (%)">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={project.settings.discountPct}
                    onChange={(e) => updateSettings({ discountPct: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Transporte (€)">
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={project.settings.transport}
                    onChange={(e) => updateSettings({ transport: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Empresa">
                  <Input
                    value={project.settings.companyName}
                    onChange={(e) => updateSettings({ companyName: e.target.value })}
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* totals sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-serif text-lg text-ink">Resumen</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Line label="Materiales" value={formatCurrency(totals.materials)} />
                <Line label="Mano de obra" value={formatCurrency(totals.labor)} />
                <Line label="Transporte" value={formatCurrency(totals.transport)} />
                <Line label="Subtotal" value={formatCurrency(totals.subtotal)} strong />
                {totals.discount > 0 && (
                  <Line label={`Descuento ${project.settings.discountPct}%`} value={`−${formatCurrency(totals.discount)}`} />
                )}
                <Line label={`IVA ${project.settings.vatPct}%`} value={formatCurrency(totals.vat)} />
                <div className="flex items-baseline justify-between border-t border-line pt-2">
                  <dt className="font-serif text-base text-ink">TOTAL</dt>
                  <dd className="font-serif text-xl text-clay tabular-nums">
                    {formatCurrency(totals.total)}
                  </dd>
                </div>
              </dl>
              <Button className="mt-4 w-full" onClick={exportPdf} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar PDF
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-serif text-lg text-ink">Comparar escenarios</h3>
              <div className="mt-3 space-y-2">
                {project.scenarios.map((s) => {
                  const t = totalsForScenario(project, s.id);
                  const active = s.id === project.activeScenarioId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => useEditor.getState().setScenario(s.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        active ? "border-clay bg-clay-tint" : "border-line hover:border-ink/20"
                      }`}
                    >
                      <span className="text-sm font-medium text-ink">{s.name}</span>
                      <span className="font-serif text-base tabular-nums text-ink">
                        {formatCurrencyShort(t.total)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Cambia materiales y mobiliario en cada escenario desde el editor para comparar
                opciones económica, estándar y premium.
              </p>
            </div>

            <PriceDisclaimer className="mt-4" />
          </aside>
        </div>
      </main>
      <Toaster />
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
