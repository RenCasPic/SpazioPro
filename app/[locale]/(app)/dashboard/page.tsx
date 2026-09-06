"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  LibraryBig,
  FolderKanban,
  ReceiptText,
  Users,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { EstimateStatusBadge } from "@/components/ui/badge";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { estimateService } from "@/lib/services/estimate-service";
import { clientService } from "@/lib/services/client-service";
import { formatUsd, formatDate } from "@/lib/format";
import { projectImage, HERO_IMAGE } from "@/lib/media/project-image";
import type { Estimate, Client } from "@/types";

export default function DashboardPage() {
  const t = useT();
  const locale = useLocale();
  const { projects, loading } = useProjects();
  const { profile } = useSession();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [heroBroken, setHeroBroken] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void estimateService.list().then(setEstimates);
    void clientService.list().then(setClients);
  }, [projects.length]);

  const stats = useMemo(() => {
    const monthMs = 30 * 864e5;
    const thisMonth = (iso: string) => now - new Date(iso).getTime() < monthMs;
    const totalValue = estimates.reduce((s, e) => s + e.total, 0);
    return {
      projects: projects.length,
      projectsMonth: projects.filter((p) => thisMonth(p.project.createdAt)).length,
      estimates: estimates.length,
      estimatesMonth: estimates.filter((e) => thisMonth(e.createdAt)).length,
      clients: clients.length,
      totalValue,
    };
  }, [projects, estimates, clients]);

  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = profile?.fullName?.split(" ")[0] ?? "";
  const recentEstimates = estimates
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-7">
      {/* hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_46%]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t(`dashboard.greeting.${greetKey}`)},
            </p>
            <h1 className="mt-1.5 display text-4xl text-ink sm:text-[44px]">{firstName || "SpazioPro"}</h1>
            <p className="mt-2 max-w-md text-[15px] text-ink-soft">{t("dashboard.hero_lead")}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <LocaleLink
                href="/projects/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90"
              >
                <Plus className="h-4 w-4" />
                {t("common.actions.new_project")}
              </LocaleLink>
              <LocaleLink
                href="/catalog"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-medium text-ink transition-colors hover:border-ink/25 hover:bg-surface-2"
              >
                <LibraryBig className="h-4 w-4" />
                {t("common.actions.browse_catalog")}
              </LocaleLink>
            </div>
          </div>
          <div className="relative h-40 bg-canvas sm:h-52 lg:h-auto lg:min-h-full">
            {!heroBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={HERO_IMAGE}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setHeroBroken(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-accent-tint),#eef1f0)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/10 to-transparent lg:w-24" />
          </div>
        </div>
      </section>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<FolderKanban className="h-4 w-4" />} label={t("common.nav.projects")} value={String(stats.projects)} trend={stats.projectsMonth ? t("dashboard.stats.this_month", { n: `↑ ${stats.projectsMonth}` }) : undefined} />
        <Stat icon={<ReceiptText className="h-4 w-4" />} label={t("dashboard.stats.estimates")} value={String(stats.estimates)} trend={stats.estimatesMonth ? t("dashboard.stats.this_month", { n: `↑ ${stats.estimatesMonth}` }) : undefined} />
        <Stat icon={<Users className="h-4 w-4" />} label={t("common.nav.clients")} value={String(stats.clients)} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label={t("dashboard.stats.estimated_value")} value={formatUsd(stats.totalValue, locale)} />
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* recent projects */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-[17px] text-ink">{t("dashboard.recent_projects")}</h2>
            <LocaleLink href="/projects" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-dark">
              {t("dashboard.view_all")} <ArrowRight className="h-3.5 w-3.5" />
            </LocaleLink>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-60" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-5 w-5" />}
              title={t("dashboard.empty.title")}
              description={t("dashboard.empty.description")}
              action={
                <LocaleLink href="/projects/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90">
                  {t("dashboard.empty.cta")}
                </LocaleLink>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.slice(0, 4).map((e) => (
                <ProjectCard key={e.project.id} entry={e} />
              ))}
            </div>
          )}
        </section>

        {/* recent estimates */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-[17px] text-ink">{t("dashboard.recent_estimates")}</h2>
            <LocaleLink href="/estimates" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-dark">
              {t("dashboard.view_all")} <ArrowRight className="h-3.5 w-3.5" />
            </LocaleLink>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : recentEstimates.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">{t("common.states.empty")}</p>
            ) : (
              recentEstimates.map((e) => {
                const entry = projects.find((p) => p.project.id === e.projectId);
                return (
                  <EstimateRow
                    key={e.id}
                    estimate={e}
                    projectName={entry?.project.name}
                    imageSrc={
                      entry?.thumbnailUrl && !entry.thumbnailUrl.startsWith("data:image/svg")
                        ? entry.thumbnailUrl
                        : projectImage(entry?.project.projectType ?? "other", e.projectId, 200)
                    }
                    locale={locale}
                  />
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-ink-soft">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-canvas">{icon}</span>
        <span className="text-[12px] text-muted">{label}</span>
      </div>
      <p className="mt-2.5 display text-[26px] leading-none text-ink">{value}</p>
      {trend && <p className="mt-1.5 text-[11px] font-medium text-ok">{trend}</p>}
    </div>
  );
}

function EstimateRow({
  estimate,
  projectName,
  imageSrc,
  locale,
}: {
  estimate: Estimate;
  projectName?: string;
  imageSrc: string;
  locale: "en-US" | "es-US";
}) {
  const t = useT();
  const [broken, setBroken] = useState(false);
  const project = projectName ?? "Project";
  return (
    <LocaleLink
      href={`/estimates/${estimate.id}`}
      className="group flex items-center gap-3 border-b border-line px-3.5 py-3 last:border-0 hover:bg-canvas"
    >
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-canvas">
        {!broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="block h-full w-full bg-[linear-gradient(135deg,var(--color-accent-tint),#eef1f0)]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{project}</span>
        <span className="block truncate text-[11px] text-muted">
          {estimate.city}, {estimate.stateCode} · {formatUsd(estimate.total, locale)}
        </span>
        <span className="mt-1 inline-block">
          <EstimateStatusBadge status={estimate.status} label={t(`estimates.detail.status.${estimate.status}`)} />
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[11px] text-muted">{formatDate(estimate.createdAt, locale)}</span>
        <ArrowUpRight className="ml-auto mt-1 h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </LocaleLink>
  );
}
