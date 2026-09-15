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
  Trophy,
  Clock,
  XCircle,
  TrendingUp,
  FileWarning,
  Ruler,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { EstimateStatusBadge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/table";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { estimateService } from "@/lib/services/estimate-service";
import { clientService } from "@/lib/services/client-service";
import { dashboardService, type OperationalSummary } from "@/lib/services/dashboard-service";
import { formatUsd, formatUsd0, formatDate } from "@/lib/format";
import { WON_STATUSES, OPEN_STATUSES, LOST_STATUSES, type Estimate, type Client } from "@/types";

const EMPTY_SUMMARY: OperationalSummary = {
  estimatesNeedingReview: [],
  unverifiedTakeoffs: [],
  projectsMissingInfo: [],
};

export default function DashboardPage() {
  const t = useT();
  const locale = useLocale();
  const router = useLocaleRouter();
  const { projects, loading } = useProjects();
  const { profile } = useSession();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<OperationalSummary>(EMPTY_SUMMARY);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void estimateService.list().then(setEstimates);
    void clientService.list().then(setClients);
    void dashboardService.operationalSummary().then(setSummary);
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
  }, [projects, estimates, clients, now]);

  const pipeline = useMemo(() => {
    const won = projects.filter((p) => WON_STATUSES.includes(p.project.status));
    const open = projects.filter((p) => OPEN_STATUSES.includes(p.project.status));
    const lost = projects.filter((p) => LOST_STATUSES.includes(p.project.status));
    const avgValue = projects.length
      ? projects.reduce((s, p) => s + p.headlineTotal, 0) / projects.length
      : 0;
    return { won: won.length, open: open.length, lost: lost.length, avgValue };
  }, [projects]);

  const isProfessional = profile?.workspaceMode === "professional";
  const attentionCount =
    summary.estimatesNeedingReview.length + summary.unverifiedTakeoffs.length + summary.projectsMissingInfo.length;

  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = profile?.fullName?.split(" ")[0] ?? "";
  const operationalRows = projects.slice(0, 8);

  return (
    <div className="space-y-7">
      {/* header — compact banner, not a lifestyle photo */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-6 py-5 sm:px-8 sm:py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t(`dashboard.greeting.${greetKey}`)},
          </p>
          <h1 className="mt-1 display text-[28px] text-ink sm:text-[32px]">{firstName || "Estimate It"}</h1>
          <p className="mt-1.5 max-w-md text-[14px] text-ink-soft">{t("dashboard.hero_lead")}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <LocaleLink
            href="/projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" />
            {t("common.actions.new_project")}
          </LocaleLink>
          <LocaleLink
            href="/catalog"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink/25 hover:bg-surface-2"
          >
            <LibraryBig className="h-4 w-4" />
            {t("common.actions.browse_catalog")}
          </LocaleLink>
        </div>
      </section>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<FolderKanban className="h-4 w-4" />} label={t("common.nav.projects")} value={String(stats.projects)} trend={stats.projectsMonth ? t("dashboard.stats.this_month", { n: `↑ ${stats.projectsMonth}` }) : undefined} />
        <Stat icon={<ReceiptText className="h-4 w-4" />} label={t("dashboard.stats.estimates")} value={String(stats.estimates)} trend={stats.estimatesMonth ? t("dashboard.stats.this_month", { n: `↑ ${stats.estimatesMonth}` }) : undefined} />
        <Stat icon={<Users className="h-4 w-4" />} label={t("common.nav.clients")} value={String(stats.clients)} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label={t("dashboard.stats.estimated_value")} value={formatUsd(stats.totalValue, locale)} />
      </div>

      {/* pipeline — professional workspace only */}
      {isProfessional && stats.projects > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-[17px] text-ink">{t("dashboard.pipeline.title")}</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={<Trophy className="h-4 w-4" />} label={t("dashboard.pipeline.won")} value={String(pipeline.won)} />
            <Stat icon={<Clock className="h-4 w-4" />} label={t("dashboard.pipeline.open")} value={String(pipeline.open)} />
            <Stat icon={<XCircle className="h-4 w-4" />} label={t("dashboard.pipeline.lost")} value={String(pipeline.lost)} />
            <Stat icon={<TrendingUp className="h-4 w-4" />} label={t("dashboard.pipeline.avg_value")} value={formatUsd0(pipeline.avgValue, locale)} />
          </div>
        </div>
      )}

      {/* operational — what needs a look right now */}
      {isProfessional && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-serif text-[17px] text-ink">{t("dashboard.attention.title")}</h2>
            {attentionCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-warn-bg px-1.5 text-[11px] font-semibold text-warn">
                {attentionCount}
              </span>
            )}
          </div>
          {attentionCount === 0 ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-5 py-4 text-[13px] text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-ok" />
              {t("dashboard.attention.all_clear")}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <AttentionPanel
                icon={<FileWarning className="h-3.5 w-3.5" />}
                title={t("dashboard.attention.estimates_review")}
                count={summary.estimatesNeedingReview.length}
              >
                {summary.estimatesNeedingReview.map(({ estimate, projectName }) => (
                  <LocaleLink
                    key={estimate.id}
                    href={`/estimates/${estimate.id}`}
                    className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12.5px] first:border-t-0 hover:bg-canvas"
                  >
                    <span className="min-w-0 truncate text-ink">{projectName || estimate.estimateNumber}</span>
                    <span className="shrink-0 text-muted">{formatUsd(estimate.total, locale)}</span>
                  </LocaleLink>
                ))}
              </AttentionPanel>

              <AttentionPanel
                icon={<Ruler className="h-3.5 w-3.5" />}
                title={t("dashboard.attention.takeoffs_review")}
                count={summary.unverifiedTakeoffs.length}
              >
                {summary.unverifiedTakeoffs.map(({ measurement, projectId, projectName }) => (
                  <LocaleLink
                    key={measurement.id}
                    href={`/projects/${projectId}/takeoff`}
                    className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12.5px] first:border-t-0 hover:bg-canvas"
                  >
                    <span className="min-w-0 truncate text-ink">{measurement.label}</span>
                    <span className="shrink-0 truncate text-muted">{projectName}</span>
                  </LocaleLink>
                ))}
              </AttentionPanel>

              <AttentionPanel
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                title={t("dashboard.attention.missing_info")}
                count={summary.projectsMissingInfo.length}
              >
                {summary.projectsMissingInfo.map(({ project, missing }) => (
                  <LocaleLink
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12.5px] first:border-t-0 hover:bg-canvas"
                  >
                    <span className="min-w-0 truncate text-ink">{project.name}</span>
                    <span className="shrink-0 truncate text-muted">
                      {missing.map((m) => t(`dashboard.attention.missing_${m}`)).join(" · ")}
                    </span>
                  </LocaleLink>
                ))}
              </AttentionPanel>
            </div>
          )}
        </section>
      )}

      {/* operational project table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] text-ink">{t("dashboard.recent_projects")}</h2>
          <LocaleLink href="/projects" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-dark">
            {t("dashboard.view_all")} <ArrowRight className="h-3.5 w-3.5" />
          </LocaleLink>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-5 w-5" />}
            title={t("dashboard.empty.title")}
            description={t("dashboard.empty.description")}
            action={
              <LocaleLink href="/projects/new" className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90">
                {t("dashboard.empty.cta")}
              </LocaleLink>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>{t("dashboard.table.project")}</TH>
                <TH>{t("dashboard.table.client")}</TH>
                <TH>{t("dashboard.table.stage")}</TH>
                <TH align="right">{t("dashboard.table.estimate")}</TH>
                <TH align="right">{t("dashboard.table.updated")}</TH>
              </tr>
            </THead>
            <TBody>
              {operationalRows.map((entry) => (
                <TR key={entry.project.id} onClick={() => router.push(`/projects/${entry.project.id}`)}>
                  <TD className="font-medium">{entry.project.name}</TD>
                  <TD className="text-ink-soft">{entry.clientName ?? t("dashboard.table.no_client")}</TD>
                  <TD>
                    <StatusBadge status={entry.project.status} label={t(`common.project_status.${entry.project.status}`)} />
                  </TD>
                  <TD align="right">{entry.headlineTotal > 0 ? formatUsd(entry.headlineTotal, locale) : "—"}</TD>
                  <TD align="right" className="text-ink-soft">{formatDate(entry.project.updatedAt, locale)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
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
        <Table>
          <THead>
            <tr>
              <TH>{t("dashboard.table.project")}</TH>
              <TH>{t("dashboard.table.status")}</TH>
              <TH align="right">{t("dashboard.table.estimate")}</TH>
              <TH align="right">{t("dashboard.table.updated")}</TH>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-3">
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-9" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : estimates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
                  {t("common.states.empty")}
                </td>
              </tr>
            ) : (
              estimates
                .slice()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 6)
                .map((e) => {
                  const entry = projects.find((p) => p.project.id === e.projectId);
                  return (
                    <TR key={e.id} onClick={() => router.push(`/estimates/${e.id}`)}>
                      <TD className="font-medium">{entry?.project.name ?? e.estimateNumber}</TD>
                      <TD>
                        <EstimateStatusBadge status={e.status} label={t(`estimates.detail.status.${e.status}`)} />
                      </TD>
                      <TD align="right">{formatUsd(e.total, locale)}</TD>
                      <TD align="right" className="text-ink-soft">{formatDate(e.createdAt, locale)}</TD>
                    </TR>
                  );
                })
            )}
          </TBody>
        </Table>
      </section>
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

function AttentionPanel({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
        <span className="text-ink-soft">{icon}</span>
        <span className="text-[12px] font-medium text-ink">{title}</span>
        <span className="ml-auto text-[11px] font-semibold text-muted">{count}</span>
      </div>
      {children}
    </div>
  );
}
