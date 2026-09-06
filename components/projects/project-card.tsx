"use client";

import { ArrowRight } from "lucide-react";
import type { ProjectListEntry } from "@/lib/services/project-service";
import { StatusBadge } from "@/components/ui/badge";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatDate } from "@/lib/format";

export function ProjectCard({ entry }: { entry: ProjectListEntry }) {
  const t = useT();
  const locale = useLocale();
  const { project, location } = entry;

  return (
    <LocaleLink
      href={`/projects/${project.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-paper">
        {entry.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnailUrl}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(180deg,#f4f1ea,#e5ddce)]" />
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={project.status} label={t(`common.project_status.${project.status}`)} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-ink">{project.name}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {entry.clientName ? `${entry.clientName} · ` : ""}
          {t(`common.project_type.${project.projectType}`)}
          {location ? ` · ${location.city}, ${location.stateCode}` : ""}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-ink-soft">
            {t("projects.card.edited", { date: formatDate(project.updatedAt, locale) })}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-clay group-hover:text-clay-dark">
            {t("common.actions.continue")} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </LocaleLink>
  );
}
