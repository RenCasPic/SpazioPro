"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT } from "@/components/localization/i18n-provider";
import { PROJECT_STATUS_ORDER, type ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const t = useT();
  const { projects, loading } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");

  const filtered = useMemo(
    () =>
      projects.filter((e) => {
        if (status !== "all" && e.project.status !== status) return false;
        if (query && !`${e.project.name} ${e.clientName ?? ""} ${e.location?.city ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [projects, query, status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display text-[28px] text-ink">{t("projects.title")}</h1>
          <p className="mt-0.5 text-[13px] text-muted">{projects.length} total</p>
        </div>
        <LocaleLink
          href="/projects/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" />
          {t("common.actions.new_project")}
        </LocaleLink>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-line-strong">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("projects.filters.search_placeholder")}
            className="w-60 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div className="no-scrollbar flex flex-nowrap gap-1.5 overflow-x-auto">
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            {t("projects.filters.all")}
          </Chip>
          {PROJECT_STATUS_ORDER.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {t(`common.project_status.${s}`)}
            </Chip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" />}
          title={projects.length ? t("common.states.empty") : t("dashboard.empty.title")}
          description={projects.length ? undefined : t("dashboard.empty.description")}
          action={
            !projects.length && (
              <LocaleLink
                href="/projects/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90"
              >
                {t("common.actions.create_project")}
              </LocaleLink>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <ProjectCard key={entry.project.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-accent bg-accent-tint text-accent" : "border-line-strong text-ink-soft hover:border-ink/25 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
