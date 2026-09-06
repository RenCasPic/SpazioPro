"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { estimateService } from "@/lib/services/estimate-service";
import { projectService } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { profileService } from "@/lib/services/profile-service";
import { imageService } from "@/lib/services/image-service";
import { downloadEstimatePdf } from "@/lib/services/pdf-download";
import { currencyService } from "@/lib/market/currency-service";
import { formatDateLong } from "@/lib/format";
import { UNIT_LABELS, PRICE_DISCLAIMER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/states";
import { countryByCode } from "@/lib/market/data/countries";
import type { Estimate, Project } from "@/types";

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await estimateService.get(id);
      if (!e) {
        setState("missing");
        return;
      }
      const bundle = await projectService.get(e.projectId);
      setEstimate(e);
      setProject(bundle?.project ?? null);
      setState("ready");
    })();
  }, [id]);

  if (state === "loading") return <div className="grid place-items-center py-20"><Spinner className="h-5 w-5" /></div>;
  if (state === "missing" || !estimate)
    return (
      <p className="py-20 text-center text-sm text-ink-soft">
        No encontramos este presupuesto.{" "}
        <Link href="/estimates" className="text-clay underline">
          Volver
        </Link>
      </p>
    );

  const country = countryByCode(estimate.countryCode);
  const money = (n: number) =>
    currencyService.format({ amount: n, currency: estimate.currencyCode }, country?.locale);

  async function download() {
    if (!estimate || !project) return;
    setDownloading(true);
    try {
      const [client, profile, original] = await Promise.all([
        project.clientId ? clientService.get(project.clientId) : Promise.resolve(null),
        profileService.get(),
        imageService.original(project.id),
      ]);
      await downloadEstimatePdf({ estimate, project, client, profile, originalImage: original });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/estimates" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Presupuestos
        </Link>
        <Button size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Spinner /> : <Download className="h-4 w-4" />} Descargar PDF
        </Button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-ink">{estimate.estimateNumber}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {project?.name} · {country?.flag} {country?.name} · {formatDateLong(estimate.createdAt, country?.locale)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
            <Lock className="h-3 w-3" /> Snapshot de mercado congelado
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 font-medium">Concepto</th>
                <th className="py-2 text-right font-medium">Cantidad</th>
                <th className="py-2 text-right font-medium">Precio</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="py-2.5">
                    <span className="font-medium text-ink">{it.description}</span>
                    <span className="block text-[11px] text-muted">
                      {it.priceSnapshot.supplier ?? "—"}
                      {it.priceSnapshot.source === "converted" && " · precio de referencia"}
                      {" · "}
                      capturado {formatDateLong(it.priceSnapshot.capturedAt, country?.locale)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink-soft">
                    {it.quantity} {UNIT_LABELS[it.unit]}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink-soft">{money(it.unitPrice + it.laborPrice)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-ink">{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
          <Row label="Materiales" value={money(estimate.subtotalMaterials)} />
          <Row label="Mano de obra" value={money(estimate.subtotalLabor)} />
          <Row label="Transporte" value={money(estimate.subtotalTransport)} />
          {estimate.discount > 0 && <Row label="Descuento" value={`−${money(estimate.discount)}`} />}
          <Row label={`Impuestos ${estimate.taxRate}%`} value={money(estimate.taxAmount)} />
          <div className="flex justify-between border-t border-line pt-1.5 font-serif text-base">
            <dt>TOTAL</dt>
            <dd className="tabular-nums text-clay">{money(estimate.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="rounded-xl bg-clay-tint/50 px-4 py-3 text-xs text-clay-dark">{PRICE_DISCLAIMER}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}
