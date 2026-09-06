"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Undo2, Redo2, FileText, Columns2, Check, Loader2 } from "lucide-react";
import type { Project } from "@/types";
import { useEditor } from "@/lib/store";
import { ScenarioBar } from "./scenario-bar";
import { Logo } from "@/components/brand/logo";

export function EditorTopbar({ project }: { project: Project }) {
  const { undo, redo, past, future, mutate } = useEditor();
  const [name, setName] = useState(project.name);
  const [saved, setSaved] = useState(true);

  function commitName() {
    if (name.trim() && name !== project.name) {
      mutate((d) => {
        d.name = name.trim();
      });
      setSaved(false);
      setTimeout(() => setSaved(true), 700);
    }
  }

  return (
    <header className="z-30 flex flex-col gap-2 border-b border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
          title="Volver a proyectos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="hidden sm:block">
          <Logo href="/dashboard" size="sm" />
        </div>
        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 font-serif text-base text-ink outline-none hover:bg-paper focus:bg-paper"
        />

        <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 text-sage" /> Guardado
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
            </>
          )}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!past.length}
            title="Deshacer"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            title="Rehacer"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <Link
          href={`/projects/${project.id}/compare`}
          className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex"
        >
          <Columns2 className="h-4 w-4" /> Antes / Después
        </Link>
        <Link
          href={`/projects/${project.id}/budget`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-clay px-3.5 text-[13px] font-medium text-white hover:bg-clay-dark"
        >
          <FileText className="h-4 w-4" /> Presupuesto
        </Link>
      </div>

      <ScenarioBar project={project} />
    </header>
  );
}
