"use client";

import { use, useState } from "react";
import { SplitSquareHorizontal, Rows2, Upload } from "lucide-react";
import { ProjectShell } from "@/components/projects/project-shell";
import { BeforeAfterSlider } from "@/components/editor/before-after-slider";
import { PhotoUploader } from "@/components/projects/photo-uploader";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/localization/i18n-provider";
import { imageService } from "@/lib/services/image-service";
import type { ProjectBundle } from "@/lib/services/project-service";
import { cn } from "@/lib/utils";

export default function ImagesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return (
    <ProjectShell projectId={projectId}>
      {(bundle, reload) => <Images bundle={bundle} reload={reload} />}
    </ProjectShell>
  );
}

function Images({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const t = useT();
  const [mode, setMode] = useState<"slider" | "split">("slider");
  const [replacing, setReplacing] = useState(false);
  const original = bundle.images.find((i) => i.type === "original");

  async function handleUpload(dataUrl: string) {
    const room = bundle.rooms[0];
    await imageService.addOriginal(bundle.project.id, room?.id ?? null, dataUrl);
    setReplacing(false);
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">{t("projects.tabs.images")} · {t("editor.before_after")}</h2>
        {original && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplacing((v) => !v)}>
              <Upload className="h-4 w-4" /> {t("common.actions.upload_space")}
            </Button>
            <div className="flex rounded-full border border-line-strong p-0.5">
              <Toggle active={mode === "slider"} onClick={() => setMode("slider")} icon={<SplitSquareHorizontal className="h-4 w-4" />} label="Slider" />
              <Toggle active={mode === "split"} onClick={() => setMode("split")} icon={<Rows2 className="h-4 w-4" />} label="Side by side" />
            </div>
          </div>
        )}
      </div>

      {!original || replacing ? (
        <PhotoUploader onReady={handleUpload} />
      ) : mode === "slider" ? (
        <BeforeAfterSlider image={original.originalUrl} designFilter={original.designFilter} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={original.originalUrl} alt="" className="aspect-[4/3] w-full rounded-2xl border border-line-strong object-cover" />
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={original.originalUrl} alt="" className="aspect-[4/3] w-full rounded-2xl border border-clay/40 object-cover" style={original.designFilter ? { filter: original.designFilter } : undefined} />
          </figure>
        </div>
      )}

      <PriceDisclaimer />
    </div>
  );
}

function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium", active ? "bg-ink text-white" : "text-ink-soft")}>
      {icon}
      {label}
    </button>
  );
}
