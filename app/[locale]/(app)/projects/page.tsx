"use client";

import { useMemo, useState } from "react";
import { Plus, Search, LayoutGrid, List as ListIcon, ArrowUpDown } from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/table";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd, formatDate } from "@/lib/format";
import { PROJECT_STATUS_ORDER, type ProjectStatus } from "@/types";
import type { ProjectListEntry } from "@/lib/services/project-service";
import { cn } from "@/lib/utils";

type SortKey = "name" | "status" | "estimate" | "margin" | "updated";
type ViewMode = "list" | "grid";

export default function ProjectsPage() {
  const t = useT();
  const locale = useLocale();
  const router = useLocaleRouter();
  const { projects, loading } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "updated", dir: -1 });

  const filtered = useMemo(
    () =>
      projects.filter((e) => {
        if (status !== "all" && e.project.status !== status) return false;
        if (query && !`${e.project.name} ${e.clientName ?? ""} ${e.location?.city ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [projects, query, status],
  );

  const sorted = useMemo(() => {
    const rows = filtered.slice();
    const cmp: Record<SortKey, (a: ProjectListEntry, b: ProjectListEntry) => number> = {
      name: (a, b) => a.project.name.localeCompare(b.project.name),
      status: (a, b) => PROJECT_STATUS_ORDER.indexOf(a.project.status) - PROJECT_STATUS_ORDER.indexOf(b.project.status),
      estimate: (a, b) => a.headlineTotal - b.headlineTotal,
      margin: (a, b) => (a.marginPercent ?? -1) - (b.marginPercent ?? -1),
      updated: (a, b) => a.project.updatedAt.localeCompare(b.project.updatedAt),
    };
    rows.sort((a, b) => cmp[sort.key](a, b) * sort.dir);
    return rows;
  }, [filtered, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "updated" ? -1 : 1 }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display text-[28px] text-ink">{t("projects.title")}</h1>
          <p className="mt-0.5 text-[13px] text-muted">{t("projects.count", { n: String(projects.length) })}</p>
        </div>
        <LocaleLink
          href="/projects/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90"
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
        <div className="ml-auto flex items-center rounded-lg border border-line-strong p-0.5">
          <button
            onClick={() => setView("list")}
            title={t("projects.view.list")}
            className={cn("grid h-8 w-8 place-items-center rounded-md", view === "list" ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            title={t("projects.view.grid")}
            className={cn("grid h-8 w-8 place-items-center rounded-md", view === "grid" ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" />}
          title={projects.length ? t("common.states.empty") : t("dashboard.empty.title")}
          description={projects.length ? undefined : t("dashboard.empty.description")}
          action={
            !projects.length && (
              <LocaleLink
                href="/projects/new"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90"
              >
                {t("common.actions.create_project")}
              </LocaleLink>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((entry) => (
            <ProjectCard key={entry.project.id} entry={entry} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <tr>
              <SortableTH label={t("projects.table.project")} active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
              <TH>{t("projects.table.client")}</TH>
              <TH>{t("projects.table.address")}</TH>
              <TH>{t("projects.table.type")}</TH>
              <SortableTH label={t("projects.table.status")} active={sort.key === "status"} dir={sort.dir} onClick={() => toggleSort("status")} />
              <SortableTH label={t("projects.table.estimate")} align="right" active={sort.key === "estimate"} dir={sort.dir} onClick={() => toggleSort("estimate")} />
              <SortableTH label={t("projects.table.margin")} align="right" active={sort.key === "margin"} dir={sort.dir} onClick={() => toggleSort("margin")} />
              <SortableTH label={t("projects.table.updated")} align="right" active={sort.key === "updated"} dir={sort.dir} onClick={() => toggleSort("updated")} />
            </tr>
          </THead>
          <TBody>
            {sorted.map((entry) => (
              <TR key={entry.project.id} onClick={() => router.push(`/projects/${entry.project.id}`)}>
                <TD className="font-medium">{entry.project.name}</TD>
                <TD className="text-ink-soft">{entry.clientName ?? t("projects.table.no_client")}</TD>
                <TD className="text-ink-soft">
                  {entry.location ? `${entry.location.city}, ${entry.location.stateCode}` : t("projects.table.no_address")}
                </TD>
                <TD className="text-ink-soft">{t(`common.project_type.${entry.project.projectType}`)}</TD>
                <TD>
                  <StatusBadge status={entry.project.status} label={t(`common.project_status.${entry.project.status}`)} />
                </TD>
                <TD align="right">{entry.headlineTotal > 0 ? formatUsd(entry.headlineTotal, locale) : t("projects.table.no_estimate")}</TD>
                <TD align="right" className="text-ink-soft">
                  {entry.marginPercent !== null ? `${entry.marginPercent.toFixed(0)}%` : t("projects.table.no_margin")}
                </TD>
                <TD align="right" className="text-ink-soft">{formatDate(entry.project.updatedAt, locale)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
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

function SortableTH({
  label,
  align = "left",
  active,
  dir,
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  active: boolean;
  dir: 1 | -1;
  onClick: () => void;
}) {
  return (
    <TH align={align} className="p-0">
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-1 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors hover:text-ink",
          align === "right" && "justify-end",
          active ? "text-ink" : "text-muted",
        )}
      >
        {align === "right" && active && <ArrowUpDown className={cn("h-3 w-3", dir === -1 && "rotate-180")} />}
        {label}
        {align === "left" && active && <ArrowUpDown className={cn("h-3 w-3", dir === -1 && "rotate-180")} />}
      </button>
    </TH>
  );
}
