"use client";

import Link from "next/link";
import { MoreVertical, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Project } from "@/types";
import { PROJECT_STATUS_LABELS, ROOM_TYPE_LABELS } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrencyShort, formatDate } from "@/lib/format";
import { headlineBudget } from "@/lib/estimate";
import { SurfacePreview } from "@/components/editor/surface-preview";

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const budget = headlineBudget(project);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]">
      <Link href={`/projects/${project.id}/editor`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
          {project.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.photo}
              alt={project.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={project.designFilter ? { filter: project.designFilter } : undefined}
            />
          ) : (
            <SurfacePreview project={project} className="h-full w-full" />
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={project.status} label={PROJECT_STATUS_LABELS[project.status]} />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg text-ink">{project.name}</h3>
            <p className="text-xs text-muted">
              {ROOM_TYPE_LABELS[project.roomType]} · Editado {formatDate(project.updatedAt).toLowerCase()}
            </p>
          </div>
          <button
            onClick={() => setMenu((v) => !v)}
            onBlur={() => setTimeout(() => setMenu(false), 120)}
            className="shrink-0 rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink"
            aria-label="Opciones"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Presupuesto estimado</p>
            <p className="font-serif text-xl text-ink">{formatCurrencyShort(budget)}</p>
          </div>
          <Link
            href={`/projects/${project.id}/editor`}
            className="inline-flex items-center gap-1 text-sm font-medium text-clay hover:text-clay-dark"
          >
            Continuar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {menu && (
        <div className="absolute right-3 top-12 z-10 w-40 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onDelete(project.id);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
