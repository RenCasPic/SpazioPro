"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, SplitSquareHorizontal, Rows2 } from "lucide-react";
import { useEditor } from "@/lib/store";
import { Logo } from "@/components/brand/logo";
import { BeforeAfter } from "@/components/compare/before-after";
import { SurfacePreview } from "@/components/editor/surface-preview";
import { activeTotals } from "@/lib/estimate";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, status, load } = useEditor();
  const [mode, setMode] = useState<"slider" | "split">("slider");

  useEffect(() => {
    void load(id);
  }, [id, load]);

  if (!project) {
    return (
      <div className="grid h-screen place-items-center text-sm text-ink-soft">
        {status === "missing" ? (
          <Link href="/dashboard" className="text-clay underline">
            Proyecto no encontrado — volver
          </Link>
        ) : (
          "Cargando…"
        )}
      </div>
    );
  }

  const totals = activeTotals(project);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${id}/editor`}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Logo href="/dashboard" size="sm" />
          </div>
          <Link
            href={`/projects/${id}/budget`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-clay px-3.5 text-[13px] font-medium text-white hover:bg-clay-dark"
          >
            <FileText className="h-4 w-4" /> Presupuesto
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-ink">Antes / Después</h1>
            <p className="mt-1 text-sm text-ink-soft">{project.name}</p>
          </div>
          <div className="flex rounded-full border border-line-strong p-0.5">
            <button
              onClick={() => setMode("slider")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
                mode === "slider" ? "bg-ink text-white" : "text-ink-soft",
              )}
            >
              <SplitSquareHorizontal className="h-4 w-4" /> Slider
            </button>
            <button
              onClick={() => setMode("split")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
                mode === "split" ? "bg-ink text-white" : "text-ink-soft",
              )}
            >
              <Rows2 className="h-4 w-4" /> Lado a lado
            </button>
          </div>
        </div>

        <div className="mt-6">
          {!project.photo ? (
            <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
              Este proyecto no tiene fotografía. Añádela desde el editor para comparar.
            </div>
          ) : mode === "slider" ? (
            <BeforeAfter image={project.photo} designFilter={project.designFilter} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.photo}
                  alt="Original"
                  className="aspect-[4/3] w-full rounded-2xl border border-line-strong object-cover"
                />
                <figcaption className="mt-2 text-center text-xs text-muted">Original</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.photo}
                  alt="Diseño"
                  className="aspect-[4/3] w-full rounded-2xl border border-clay/40 object-cover"
                  style={project.designFilter ? { filter: project.designFilter } : undefined}
                />
                <figcaption className="mt-2 text-center text-xs text-muted">
                  Propuesta de diseño
                </figcaption>
              </figure>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Presupuesto de esta propuesta</p>
            <p className="font-serif text-2xl text-ink">{formatCurrency(totals.total)}</p>
          </div>
          <div className="hidden h-16 w-24 overflow-hidden rounded-lg border border-line sm:block">
            <SurfacePreview project={project} className="h-full w-full" />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          En modo demo la propuesta se muestra como un ajuste de color sobre la foto original. Al
          conectar un proveedor de generación de imágenes, aquí se mostraría un render fotorrealista
          del espacio con los materiales y el mobiliario aplicados.
        </p>
      </main>
    </div>
  );
}
