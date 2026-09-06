"use client";

import { useState } from "react";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import type { ProjectListEntry } from "@/lib/services/project-service";
import { StatusBadge } from "@/components/ui/badge";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatDate, formatUsd } from "@/lib/format";
import { projectImage } from "@/lib/media/project-image";
import { cn } from "@/lib/utils";

export function ProjectCard({
  entry,
  compact = false,
}: {
  entry: ProjectListEntry;
  compact?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const { project, location } = entry;
  const [broken, setBroken] = useState(false);
  const src =
    entry.thumbnailUrl && !entry.thumbnailUrl.startsWith("data:image/svg")
      ? entry.thumbnailUrl
      : projectImage(project.projectType, project.id);
  const value = entry.headlineTotal ?? 0;

  return (
    <LocaleLink
      href={`/projects/${project.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface card-hover"
    >
      <div className={cn("relative overflow-hidden bg-canvas", compact ? "aspect-[16/9]" : "aspect-[16/10]")}>
        {!broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={project.name}
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,var(--color-accent-tint),#eef1f0)]" />
        )}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={project.status} label={t(`common.project_status.${project.status}`)} />
        </div>
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-[15px] text-ink">{project.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
          <MapPin className="h-3 w-3" />
          {location ? `${location.city}, ${location.stateCode}` : t(`common.project_type.${project.projectType}`)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[12px]">
          <span className="flex items-center gap-1 text-muted">
            <Clock className="h-3 w-3" />
            {t("projects.card.edited", { date: formatDate(project.updatedAt, locale) })}
          </span>
          {value > 0 && <span className="font-medium tabular-nums text-ink">{formatUsd(value, locale)}</span>}
        </div>
      </div>
    </LocaleLink>
  );
}
