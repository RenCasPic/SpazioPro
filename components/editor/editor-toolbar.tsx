"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Undo2, Redo2, FileText, Columns2, Check, Loader2, MapPin, Image as ImageIcon, Box } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { cn } from "@/lib/utils";
import { useScenarioTotals } from "@/hooks/use-estimate";
import { useT } from "@/components/localization/i18n-provider";
import { LocaleLink } from "@/components/localization/locale-link";
import { ScenarioSwitcher } from "./scenario-switcher";
import { ChangeLocationDialog } from "@/components/projects/change-location-dialog";
import { projectService } from "@/lib/services/project-service";
import { Logo } from "@/components/brand/logo";

export function EditorToolbar({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const { past, future, undo, redo, setScenario, addScenario, reload, viewMode, setViewMode, roomModel } =
    useEditor();
  const [name, setName] = useState(bundle.project.name);
  const [saved, setSaved] = useState(true);
  const [locationOpen, setLocationOpen] = useState(false);

  const totals = useScenarioTotals(
    bundle.project.id,
    bundle.scenarios.map((s) => s.id),
    bundle.items.length + JSON.stringify(bundle.config) + bundle.project.stateCode,
  );

  useEffect(() => setName(bundle.project.name), [bundle.project.name]);

  async function commitName() {
    if (name.trim() && name !== bundle.project.name) {
      setSaved(false);
      await projectService.update(bundle.project.id, { name: name.trim() });
      await reload();
      setSaved(true);
    }
  }

  return (
    <header className="z-30 flex flex-col gap-2 border-b border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <LocaleLink href={`/projects/${bundle.project.id}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/5" title={t("common.actions.back")}>
          <ArrowLeft className="h-4 w-4" />
        </LocaleLink>
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
              <Check className="h-3.5 w-3.5 text-sage" /> {t("common.actions.saved")}
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("common.actions.saving")}
            </>
          )}
        </span>

        <button onClick={() => setLocationOpen(true)} className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex" title={t("editor.change_location")}>
          <MapPin className="h-4 w-4" /> {bundle.location?.stateCode ?? bundle.project.stateCode}
        </button>

        <div className="hidden items-center rounded-full border border-line-strong p-0.5 sm:flex">
          <button
            onClick={() => setViewMode("photo")}
            title={t("editor.d3.mode_photo")}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full",
              viewMode === "photo" ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("3d")}
            title={t("editor.d3.mode_3d")}
            className={cn(
              "relative grid h-8 w-8 place-items-center rounded-full",
              viewMode === "3d" ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            <Box className="h-4 w-4" />
            {roomModel && viewMode !== "3d" && (
              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={undo} disabled={!past.length} title={t("editor.undo")} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={!future.length} title={t("editor.redo")} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-40">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <LocaleLink href={`/projects/${bundle.project.id}/images`} className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-ink hover:border-ink/30 sm:inline-flex">
          <Columns2 className="h-4 w-4" /> {t("editor.before_after")}
        </LocaleLink>
        <LocaleLink href={`/projects/${bundle.project.id}/estimate`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-dark">
          <FileText className="h-4 w-4" /> {t("editor.studio.calc")}
        </LocaleLink>
      </div>

      <ScenarioSwitcher
        scenarios={bundle.scenarios}
        activeId={bundle.project.activeScenarioId}
        totals={Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, { total: v.total }]))}
        onSelect={setScenario}
        onAdd={(tier) => addScenario(tier)}
      />

      <ChangeLocationDialog open={locationOpen} onClose={() => setLocationOpen(false)} bundle={bundle} />
    </header>
  );
}
