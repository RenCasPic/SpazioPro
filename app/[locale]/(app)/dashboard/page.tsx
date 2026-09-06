"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, FolderKanban, ReceiptText, CheckCircle2, TrendingUp } from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { estimateService } from "@/lib/services/estimate-service";
import { formatUsd, formatDate } from "@/lib/format";
import type { Estimate } from "@/types";

export default function DashboardPage() {
  const t = useT();
  const locale = useLocale();
  const { projects, loading } = useProjects();
  const { profile } = useSession();
  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    void estimateService.list().then(setEstimates);
  }, [projects.length]);

  const stats = useMemo(() => {
    const completed = projects.filter((p) => p.project.status === "completed").length;
    const active = projects.filter((p) => ["designing", "estimating", "quoted"].includes(p.project.status)).length;
    const totalValue = estimates.reduce((s, e) => s + e.total, 0);
    return { completed, active, totalValue };
  }, [projects, estimates]);

  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = profile?.fullName?.split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">
            {t(`dashboard.greeting.${greetKey}`)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {projects.length ? t("dashboard.subtitle_has_projects") : t("dashboard.subtitle_empty")}
          </p>
        </div>
        <LocaleLink
          href="/projects/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-clay px-4 text-sm font-medium text-white hover:bg-clay-dark"
        >
          <Plus className="h-4 w-4" />
          {t("common.actions.new_project")}
        </LocaleLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={<FolderKanban className="h-4 w-4" />} label={t("dashboard.stats.active_projects")} value={String(stats.active)} />
        <MiniStat icon={<ReceiptText className="h-4 w-4" />} label={t("dashboard.stats.estimates")} value={String(estimates.length)} />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label={t("dashboard.stats.completed")} value={String(stats.completed)} />
        <MiniStat icon={<TrendingUp className="h-4 w-4" />} label={t("dashboard.stats.estimated_value")} value={formatUsd(stats.totalValue, locale)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">{t("dashboard.recent_projects")}</h2>
          <LocaleLink href="/projects" className="text-sm text-clay hover:text-clay-dark">
            {t("dashboard.view_all")}
          </LocaleLink>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-5 w-5" />}
            title={t("dashboard.empty.title")}
            description={t("dashboard.empty.description")}
            action={
              <LocaleLink
                href="/projects/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-clay px-5 text-sm font-medium text-white hover:bg-clay-dark"
              >
                {t("dashboard.empty.cta")}
              </LocaleLink>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((e) => (
              <ProjectCard key={e.project.id} entry={e} />
            ))}
          </div>
        )}
      </section>

      {estimates.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-ink">{t("dashboard.recent_estimates")}</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {estimates.slice(0, 5).map((e) => {
              const project = projects.find((p) => p.project.id === e.projectId);
              return (
                <LocaleLink
                  key={e.id}
                  href={`/estimates/${e.id}`}
                  className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-paper"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{e.estimateNumber}</p>
                    <p className="text-xs text-muted">
                      {project?.project.name ?? "Project"} · {formatDate(e.createdAt, locale)}
                    </p>
                  </div>
                  <span className="font-serif text-base tabular-nums text-ink">{formatUsd(e.total, locale)}</span>
                </LocaleLink>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-serif text-lg text-ink">{value}</p>
    </div>
  );
}
