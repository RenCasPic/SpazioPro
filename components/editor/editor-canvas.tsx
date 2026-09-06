"use client";

import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Scan } from "lucide-react";
import type { SurfaceKind } from "@/lib/constants";
import { SURFACE_KEYS } from "@/lib/constants";
import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { useT } from "@/components/localization/i18n-provider";
import { CanvasObject } from "./canvas-object";
import { SurfacePreview } from "./surface-preview";
import { cn } from "@/lib/utils";

const SURFACES: SurfaceKind[] = ["floor", "wall", "ceiling"];

export function EditorCanvas({ bundle }: { bundle: ProjectBundle }) {
  const t = useT();
  const canvasRef = useRef<HTMLDivElement>(null);
  const { selectedItemId, select, setTransform, commitTransform, activeSurface, setActiveSurface } = useEditor();
  const [zoom, setZoom] = useState(1);

  const original = bundle.images.find((i) => i.type === "original");
  const objects = activeItems(bundle).filter((i) => i.kind === "object");

  return (
    <div className="relative flex h-full flex-col bg-[repeating-conic-gradient(#f0ece4_0%_25%,#f6f3ee_0%_50%)] bg-[length:22px_22px]">
      <div className="pointer-events-none absolute right-3 top-3 z-20">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1 shadow-sm backdrop-blur">
          <IconBtn label={t("editor.zoom_out")} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}>
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <span className="w-10 text-center text-xs tabular-nums text-ink-soft">{Math.round(zoom * 100)}%</span>
          <IconBtn label={t("editor.zoom_in")} onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
          <IconBtn label={t("editor.fit")} onClick={() => setZoom(1)}>
            <Scan className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label={t("editor.fullscreen")}
            onClick={() => {
              const el = canvasRef.current?.closest("[data-editor-shell]") as HTMLElement | null;
              if (!document.fullscreenElement) el?.requestFullscreen?.();
              else document.exitFullscreen?.();
            }}
          >
            <Maximize className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        <div
          ref={canvasRef}
          onClick={() => {
            select(null);
            setActiveSurface(null);
          }}
          className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[var(--shadow-pop)]"
          style={{ transform: `scale(${zoom})`, transition: "transform .15s ease" }}
        >
          {original ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={original.originalUrl}
              alt={bundle.project.name}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={original.designFilter ? { filter: original.designFilter } : undefined}
              draggable={false}
            />
          ) : (
            <SurfacePreview bundle={bundle} className="absolute inset-0 h-full w-full" />
          )}

          <SurfaceOverlay surface={activeSurface} />

          {objects
            .slice()
            .sort((a, b) => a.layer - b.layer)
            .map((item) => (
              <CanvasObject
                key={item.id}
                item={item}
                selected={selectedItemId === item.id}
                onSelect={() => select(item.id)}
                onTransform={(patch) => setTransform(item.id, patch)}
                onCommit={commitTransform}
                containerRef={canvasRef}
              />
            ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-line bg-surface/80 p-3 backdrop-blur">
        <span className="mr-1 text-xs text-muted">{t("editor.select_zone")}</span>
        {SURFACES.map((s) => {
          const applied = activeItems(bundle).some((i) => i.kind === "surface" && i.surface === s);
          return (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSurface(activeSurface === s ? null : s);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                activeSurface === s ? "border-clay bg-clay text-white" : "border-line-strong text-ink hover:border-ink/30",
              )}
            >
              {t(SURFACE_KEYS[s])}
              {applied && <span className={cn("h-1.5 w-1.5 rounded-full", activeSurface === s ? "bg-white" : "bg-sage")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SurfaceOverlay({ surface }: { surface: SurfaceKind | null }) {
  if (!surface) return null;
  const clip =
    surface === "floor"
      ? "polygon(12% 58%, 88% 58%, 100% 100%, 0 100%)"
      : surface === "ceiling"
        ? "polygon(0 0, 100% 0, 88% 34%, 12% 34%)"
        : "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
  return (
    <div
      className="pointer-events-none absolute inset-0 animate-pulse"
      style={{ clipPath: clip, background: "rgba(180,83,42,0.28)", border: "2px solid rgba(180,83,42,0.7)", mixBlendMode: "multiply" }}
    />
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </button>
  );
}
