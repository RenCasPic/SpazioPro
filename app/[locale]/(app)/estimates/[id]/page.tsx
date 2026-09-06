"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { estimateService } from "@/lib/services/estimate-service";
import { projectService } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { profileService } from "@/lib/services/profile-service";
import { imageService } from "@/lib/services/image-service";
import { locationService } from "@/lib/services/location-service";
import { downloadEstimatePdf } from "@/lib/services/pdf-download";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/states";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd, formatDateLong } from "@/lib/format";
import { UNIT_KEYS } from "@/lib/constants";
import { stateService } from "@/lib/market/country-service";
import type { Estimate, Project } from "@/types";

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const locale = useLocale();
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
        {t("common.states.not_found")}{" "}
        <LocaleLink href="/estimates" className="text-clay underline">
          {t("estimates.list_title")}
        </LocaleLink>
      </p>
    );

  const money = (n: number) => formatUsd(n, locale);
  const CL = (k: string) => t(`estimates.cost_lines.${k}`);
  const subtotal =
    estimate.subtotalMaterials + estimate.subtotalLabor + estimate.subtotalEquipment + estimate.subtotalDelivery + estimate.subtotalDisposal + estimate.subtotalPermits + estimate.subtotalOther;

  async function download() {
    if (!estimate || !project) return;
    setDownloading(true);
    try {
      const [client, profile, original, location] = await Promise.all([
        project.clientId ? clientService.get(project.clientId) : Promise.resolve(null),
        profileService.get(),
        imageService.original(project.id),
        locationService.forProject(project.id),
      ]);
      await downloadEstimatePdf({ estimate, project, client, profile, location, originalImage: original });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <LocaleLink href="/estimates" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {t("estimates.list_title")}
        </LocaleLink>
        <Button size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Spinner /> : <Download className="h-4 w-4" />} {t("common.actions.download_pdf")}
        </Button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-ink">{estimate.estimateNumber}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {project?.name} · {estimate.city}, {stateService.name(estimate.stateCode)} · {formatDateLong(estimate.createdAt, locale)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-tint px-2.5 py-1 text-[11px] font-medium text-clay-dark">
            <Lock className="h-3 w-3" /> {t("estimates.detail.snapshot_frozen")}
          </span>
        </div>

        {estimate.scopeOfWork.trim() && (
          <div className="mt-5">
            <h3 className="font-serif text-base text-ink">{t("estimates.settings.scope_of_work")}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{estimate.scopeOfWork}</p>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 font-medium">{t("estimates.table.item")}</th>
                <th className="py-2 text-right font-medium">{t("estimates.table.quantity")}</th>
                <th className="py-2 text-right font-medium">{t("estimates.table.price")}</th>
                <th className="py-2 text-right font-medium">{t("estimates.table.total")}</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="py-2.5">
                    <span className="font-medium text-ink">{it.description}</span>
                    <span className="block text-[11px] text-muted">
                      {it.priceSnapshot.supplier ?? "—"} · {t("estimates.detail.captured", { date: formatDateLong(it.priceSnapshot.capturedAt, locale) })}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink-soft">
                    {it.quantity} {t(UNIT_KEYS[it.unit])}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink-soft">{money(it.unitPrice + it.laborPrice)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-ink">{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
          <Row label={CL("materials")} value={money(estimate.subtotalMaterials)} />
          <Row label={CL("labor")} value={money(estimate.subtotalLabor)} />
          {estimate.subtotalEquipment > 0 && <Row label={CL("equipment")} value={money(estimate.subtotalEquipment)} />}
          {estimate.subtotalDelivery > 0 && <Row label={CL("delivery")} value={money(estimate.subtotalDelivery)} />}
          {estimate.subtotalDisposal > 0 && <Row label={CL("disposal")} value={money(estimate.subtotalDisposal)} />}
          {estimate.subtotalPermits > 0 && <Row label={CL("permits")} value={money(estimate.subtotalPermits)} />}
          {estimate.subtotalOther > 0 && <Row label={CL("other")} value={money(estimate.subtotalOther)} />}
          <Row label={CL("subtotal")} value={money(Math.round(subtotal * 100) / 100)} />
          {estimate.discount > 0 && <Row label={CL("discount")} value={`−${money(estimate.discount)}`} />}
          <Row label={`${CL("sales_tax")} ${estimate.salesTaxRate}%`} value={money(estimate.taxAmount)} />
          <div className="flex justify-between border-t border-line pt-1.5 font-serif text-base">
            <dt>{CL("grand_total")}</dt>
            <dd className="tabular-nums text-clay">{money(estimate.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="rounded-xl bg-clay-tint/50 px-4 py-3 text-xs text-clay-dark">{t("common.disclaimer")}</p>
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
