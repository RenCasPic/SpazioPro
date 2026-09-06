"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectListEntry } from "@/lib/services/project-service";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { countryByCode } from "@/lib/market/data/countries";

export function ProjectCard({ entry }: { entry: ProjectListEntry }) {
  const { project } = entry;
  const country = countryByCode(project.countryCode);

  return (
    <Link
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
          <StatusBadge status={project.status} label={PROJECT_STATUS_LABELS[project.status]} />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-ink/75 px-2 py-1 text-[11px] font-medium text-white">
          {country?.flag} {country?.currencyCode}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-ink">{project.name}</h3>
        <p className="mt-0.5 text-xs text-muted">
          {entry.clientName ? `${entry.clientName} · ` : ""}
          {PROJECT_TYPE_LABELS[project.projectType]} · {country?.name}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-ink-soft">Editado {formatDate(project.updatedAt).toLowerCase()}</span>
          <span className="inline-flex items-center gap-1 font-medium text-clay group-hover:text-clay-dark">
            Continuar <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
