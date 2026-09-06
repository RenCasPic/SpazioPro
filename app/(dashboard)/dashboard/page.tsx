"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, FolderKanban, ReceiptText, CheckCircle2, TrendingUp } from "lucide-react";
import { useProjects } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { estimateService } from "@/lib/services/estimate-service";
import { currencyService } from "@/lib/market/currency-service";
import { formatDate } from "@/lib/format";
import type { Estimate } from "@/types";

export default function DashboardPage() {
  const { projects, loading } = useProjects();
  const { profile } = useSession();
  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    void estimateService.list().then(setEstimates);
  }, [projects.length]);

  const stats = useMemo(() => {
    const completed = projects.filter((p) => p.project.status === "completed").length;
    const active = projects.filter((p) =>
      ["designing", "estimating", "quoted"].includes(p.project.status),
    ).length;
    const totalValue = estimates.reduce((sum, e) => {
      try {
        return sum + currencyService.convert({ amount: e.total, currency: e.currencyCode }, "EUR").amount;
      } catch {
        return sum;
      }
    }, 0);
    return { completed, active, totalValue };
  }, [projects, estimates]);

  const recent = projects.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">
            Hola{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {projects.length
              ? "Continúa donde lo dejaste o empieza un proyecto nuevo."
              : "Empieza creando tu primer proyecto."}
          </p>
        </div>
        <ButtonLink href="/projects/new">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </ButtonLink>
      </div>

      {/* light stat row — not the focus */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={<FolderKanban className="h-4 w-4" />} label="Proyectos activos" value={String(stats.active)} />
        <MiniStat icon={<ReceiptText className="h-4 w-4" />} label="Presupuestos" value={String(estimates.length)} />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label="Completados" value={String(stats.completed)} />
        <MiniStat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Valor estimado"
          value={currencyService.format({ amount: Math.round(stats.totalValue), currency: "EUR" })}
        />
      </div>

      {/* projects — the focus */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Proyectos recientes</h2>
          <Link href="/projects" className="text-sm text-clay hover:text-clay-dark">
            Ver todos
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-5 w-5" />}
            title="Todavía no tienes proyectos"
            description="Crea tu primer proyecto: sube una foto del espacio, diséñalo y genera el presupuesto."
            action={
              <ButtonLink href="/projects/new" size="lg">
                Crear mi primer proyecto
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <ProjectCard key={entry.project.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {estimates.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-ink">Presupuestos recientes</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {estimates.slice(0, 5).map((e) => {
              const project = projects.find((p) => p.project.id === e.projectId);
              return (
                <Link
                  key={e.id}
                  href={`/estimates/${e.id}`}
                  className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-paper"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{e.estimateNumber}</p>
                    <p className="text-xs text-muted">
                      {project?.project.name ?? "Proyecto"} · {formatDate(e.createdAt)}
                    </p>
                  </div>
                  <span className="font-serif text-base tabular-nums text-ink">
                    {currencyService.format({ amount: e.total, currency: e.currencyCode })}
                  </span>
                </Link>
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
      <div className="flex items-center gap-1.5 text-muted">{icon}<span className="text-[11px] uppercase tracking-wide">{label}</span></div>
      <p className="mt-1 font-serif text-lg text-ink">{value}</p>
    </div>
  );
}
