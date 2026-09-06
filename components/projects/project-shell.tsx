"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { projectService } from "@/lib/services/project-service";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/states";
import { ProjectTabs } from "./project-tabs";
import { countryByCode } from "@/lib/market/data/countries";

export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: (bundle: ProjectBundle, reload: () => Promise<void>) => React.ReactNode;
}) {
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  const reload = async () => {
    const b = await projectService.get(projectId);
    setBundle(b);
    setState(b ? "ready" : "missing");
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (state === "missing" || !bundle) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
        No encontramos este proyecto.{" "}
        <Link href="/projects" className="text-clay underline">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  const country = countryByCode(bundle.project.countryCode);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Proyectos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl tracking-tight text-ink">{bundle.project.name}</h1>
          <StatusBadge
            status={bundle.project.status}
            label={PROJECT_STATUS_LABELS[bundle.project.status]}
          />
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {PROJECT_TYPE_LABELS[bundle.project.projectType]} · {country?.flag} {country?.name} ·{" "}
          {bundle.project.currencyCode}
        </p>
      </div>

      <ProjectTabs projectId={projectId} />

      <div>{children(bundle, reload)}</div>
    </div>
  );
}
