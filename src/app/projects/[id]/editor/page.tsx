"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { useEditor } from "@/lib/store";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { CatalogDock } from "@/components/editor/catalog-dock";
import { InspectorPanel } from "@/components/editor/inspector-panel";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, status, load } = useEditor();
  const [sheet, setSheet] = useState<"catalog" | "inspector" | null>(null);

  useEffect(() => {
    void load(id);
  }, [id, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status === "loading" || status === "idle") {
    return <CenterNote>Cargando proyecto…</CenterNote>;
  }
  if (status === "missing" || !project) {
    return (
      <CenterNote>
        No encontramos este proyecto.{" "}
        <Link href="/dashboard" className="text-clay underline">
          Volver a mis proyectos
        </Link>
      </CenterNote>
    );
  }

  return (
    <div data-editor-shell className="flex h-screen flex-col overflow-hidden bg-paper">
      <EditorTopbar project={project} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_1fr_360px]">
        {/* left: catalog */}
        <aside className="hidden min-h-0 border-r border-line lg:block">
          <CatalogDock />
        </aside>

        {/* center: canvas */}
        <section className="relative min-h-0">
          <EditorCanvas project={project} />
        </section>

        {/* right: inspector */}
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface lg:block">
          <InspectorPanel project={project} />
        </aside>
      </div>

      {/* mobile controls */}
      <div className="flex items-center gap-2 border-t border-line bg-surface p-2 lg:hidden">
        <button
          onClick={() => setSheet("catalog")}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white"
        >
          <LayoutGrid className="h-4 w-4" /> Catálogo
        </button>
        <button
          onClick={() => setSheet("inspector")}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong text-sm font-medium text-ink"
        >
          <SlidersHorizontal className="h-4 w-4" /> Detalles
        </button>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 flex h-[82vh] flex-col rounded-t-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="font-serif text-lg text-ink">
                {sheet === "catalog" ? "Catálogo" : "Detalles"}
              </span>
              <button onClick={() => setSheet(null)} className="rounded-full p-1.5 text-muted hover:bg-ink/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={cn("min-h-0 flex-1", sheet === "inspector" && "overflow-y-auto")}>
              {sheet === "catalog" ? <CatalogDock /> : <InspectorPanel project={project} />}
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}

function CenterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-screen place-items-center bg-paper px-6 text-center text-sm text-ink-soft">
      <p>{children}</p>
    </div>
  );
}
