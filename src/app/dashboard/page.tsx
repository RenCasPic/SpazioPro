"use client";

import { useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ButtonLink } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import { useProjects } from "@/lib/store";
import { Plus, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { projects, loaded, refresh, remove } = useProjects();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-full">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-ink">Mis proyectos</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Diseña tu espacio y genera un presupuesto orientativo.
            </p>
          </div>
          <ButtonLink href="/projects/new">
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </ButtonLink>
        </div>

        {!loaded ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={remove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="grid gap-8 p-8 sm:grid-cols-2 sm:p-12">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-tint text-clay-dark">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-serif text-2xl text-ink">Bienvenido a SpazioPro</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Transforma cualquier espacio antes de empezar la obra.
          </p>
          <ol className="mt-5 space-y-2 text-sm text-ink-soft">
            <li>1. Fotografía tu espacio</li>
            <li>2. Diseña diferentes opciones</li>
            <li>3. Calcula materiales</li>
            <li>4. Obtén un presupuesto</li>
          </ol>
          <ButtonLink href="/projects/new" size="lg" className="mt-7">
            <Plus className="h-4 w-4" />
            Crear mi primer proyecto
          </ButtonLink>
        </div>
        <div className="hidden rounded-xl bg-paper sm:block">
          <div className="grid h-full place-items-center p-8">
            <div className="aspect-[4/3] w-full rounded-lg border border-line-strong bg-[linear-gradient(180deg,#f4f1ea,#e8e3d9)] shadow-inner" />
          </div>
        </div>
      </div>
    </div>
  );
}
