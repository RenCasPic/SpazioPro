"use client";

import { use, useEffect, useState } from "react";
import { Pencil, ImageIcon, ReceiptText, Layers, Trash2 } from "lucide-react";
import { ProjectShell } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { ConfidencePill } from "@/components/budget/confidence-pill";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { estimateService, type LiveEstimate } from "@/lib/services/estimate-service";
import { projectService, type ProjectBundle } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { formatUsd, formatDate, formatArea, formatDimension } from "@/lib/format";
import type { Client } from "@/types";

export default function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useLocaleRouter();
  return (
    <ProjectShell projectId={projectId}>
      {(bundle) => <Overview bundle={bundle} onDeleted={() => router.push("/projects")} />}
    </ProjectShell>
  );
}

function Overview({ bundle, onDeleted }: { bundle: ProjectBundle; onDeleted: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { project, rooms, images, scenarios, location } = bundle;
  const room = rooms[0];
  const original = images.find((i) => i.type === "original");
  const [live, setLive] = useState<LiveEstimate | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    void estimateService.computeLive(project.id).then(setLive);
    if (project.clientId) void clientService.get(project.clientId).then(setClient);
  }, [project.id, project.clientId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {original ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={original.originalUrl} alt={project.name} className="aspect-[16/10] w-full object-cover" style={original.designFilter ? { filter: original.designFilter } : undefined} />
          ) : (
            <div className="grid aspect-[16/10] place-items-center bg-paper text-sm text-muted">—</div>
          )}
          <div className="flex flex-wrap gap-2 p-4">
            <LocaleLink href={`/projects/${project.id}/editor`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-clay px-3.5 text-[13px] font-medium text-white hover:bg-clay-dark">
              <Pencil className="h-4 w-4" /> {t("projects.overview.open_editor")}
            </LocaleLink>
            <LocaleLink href={`/projects/${project.id}/images`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[13px] font-medium text-ink hover:border-ink/30">
              <ImageIcon className="h-4 w-4" /> {t("projects.overview.images")}
            </LocaleLink>
            <LocaleLink href={`/projects/${project.id}/estimate`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[13px] font-medium text-ink hover:border-ink/30">
              <ReceiptText className="h-4 w-4" /> {t("projects.tabs.estimate")}
            </LocaleLink>
            <LocaleLink href={`/projects/${project.id}/scenarios`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[13px] font-medium text-ink hover:border-ink/30">
              <Layers className="h-4 w-4" /> {t("projects.tabs.scenarios")}
            </LocaleLink>
          </div>
        </div>

        {project.description && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-serif text-lg text-ink">{t("projects.overview.description")}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{project.description}</p>
          </div>
        )}

        {bundle.config.settings.scopeOfWork.trim() && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-serif text-lg text-ink">{t("projects.overview.scope_of_work")}</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-ink-soft">{bundle.config.settings.scopeOfWork}</p>
          </div>
        )}

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-serif text-lg text-ink">{t("projects.overview.scenarios")}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {scenarios.map((s) => (
              <LocaleLink key={s.id} href={`/projects/${project.id}/scenarios`} className="rounded-xl border border-line px-3 py-2.5 hover:border-ink/20">
                <p className="text-sm font-medium text-ink">{s.name}</p>
              </LocaleLink>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-serif text-lg text-ink">{t("projects.overview.estimated_total")}</h3>
          {live ? (
            <>
              <p className="mt-1 font-serif text-3xl text-ink">{formatUsd(live.totals.total, locale)}</p>
              <div className="mt-2">
                <ConfidencePill report={live.confidence} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label={t("estimates.cost_lines.materials")} value={formatUsd(live.totals.materials, locale)} />
                <Row label={t("estimates.cost_lines.labor")} value={formatUsd(live.totals.labor, locale)} />
                <Row label={`${t("estimates.cost_lines.sales_tax")} ${project.stateCode}`} value={formatUsd(live.totals.tax, locale)} />
              </dl>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("common.states.loading")}</p>
          )}
          <LocaleLink href={`/projects/${project.id}/estimate`} className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full bg-ink text-[13px] font-medium text-white hover:bg-ink/90">
            {t("projects.overview.view_full_estimate")}
          </LocaleLink>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
          <h3 className="font-serif text-lg text-ink">{t("projects.overview.details")}</h3>
          <dl className="mt-3 space-y-2">
            <Row label={t("projects.overview.client")} value={client?.name ?? "—"} />
            <Row label={t("projects.overview.location")} value={location ? `${location.city}, ${location.stateCode} ${location.zipCode}` : "—"} />
            <Row label={t("projects.overview.currency")} value="USD" />
            {room && <Row label={t("projects.overview.dimensions")} value={`${formatDimension(room.widthIn)} × ${formatDimension(room.lengthIn)} × ${formatDimension(room.heightIn)}`} />}
            {room && <Row label={t("projects.overview.floor_area")} value={formatArea(room.floorAreaSqFt, "imperial", locale)} />}
            <Row label={t("projects.overview.created")} value={formatDate(project.createdAt, locale)} />
          </dl>
        </div>

        <PriceDisclaimer />

        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={async () => {
            if (confirm(t("projects.overview.delete_confirm", { name: project.name }))) {
              await projectService.remove(project.id);
              onDeleted();
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> {t("projects.overview.delete_project")}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
