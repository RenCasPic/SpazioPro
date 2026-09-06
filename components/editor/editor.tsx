"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { useEditor } from "@/hooks/use-editor";
import { EditorToolbar } from "./editor-toolbar";
import { EditorCanvas } from "./editor-canvas";
import { EditorSidebar } from "./editor-sidebar";
import { PropertiesPanel } from "./properties-panel";
import { cn } from "@/lib/utils";

export function Editor({ projectId }: { projectId: string }) {
  const { bundle, status, load } = useEditor();
  const [sheet, setSheet] = useState<"catalog" | "props" | null>(null);

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

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
    return <Center>Cargando editor…</Center>;
  }
  if (status === "missing" || !bundle) {
    return (
      <Center>
        No encontramos este proyecto.{" "}
        <Link href="/projects" className="text-clay underline">
          Volver
        </Link>
      </Center>
    );
  }

  return (
    <div data-editor-shell className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-paper">
      <EditorToolbar bundle={bundle} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_1fr_360px]">
        <aside className="hidden min-h-0 border-r border-line lg:block">
          <EditorSidebar bundle={bundle} />
        </aside>
        <section className="relative min-h-0">
          <EditorCanvas bundle={bundle} />
        </section>
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface lg:block">
          <PropertiesPanel bundle={bundle} />
        </aside>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-surface p-2 lg:hidden">
        <button onClick={() => setSheet("catalog")} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white">
          <LayoutGrid className="h-4 w-4" /> Catálogo
        </button>
        <button onClick={() => setSheet("props")} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong text-sm font-medium text-ink">
          <SlidersHorizontal className="h-4 w-4" /> Detalles
        </button>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 flex h-[82vh] flex-col rounded-t-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="font-serif text-lg text-ink">{sheet === "catalog" ? "Catálogo" : "Detalles"}</span>
              <button onClick={() => setSheet(null)} className="rounded-full p-1.5 text-muted hover:bg-ink/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={cn("min-h-0 flex-1", sheet === "props" && "overflow-y-auto")}>
              {sheet === "catalog" ? <EditorSidebar bundle={bundle} /> : <PropertiesPanel bundle={bundle} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-paper px-6 text-center text-sm text-ink-soft">
      <p>{children}</p>
    </div>
  );
}
