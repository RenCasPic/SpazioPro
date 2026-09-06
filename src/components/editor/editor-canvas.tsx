"use client";

import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Scan } from "lucide-react";
import type { Project, SurfaceKind } from "@/types";
import { CanvasItem } from "./canvas-item";
import { SurfacePreview } from "./surface-preview";
import { useEditor, activeItems } from "@/lib/store";
import { cn } from "@/lib/utils";

const SURFACE_CHIPS: { key: SurfaceKind; label: string }[] = [
  { key: "floor", label: "Suelo" },
  { key: "wall", label: "Paredes" },
  { key: "ceiling", label: "Techo" },
];

export function EditorCanvas({ project }: { project: Project }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { selectedItemId, select, transformItem, mutate, activeSurface, setActiveSurface } =
    useEditor();
  const [zoom, setZoom] = useState(1);

  const objects = activeItems(project).filter((it) => it.kind === "object");

  function commit() {
    // force a history checkpoint after a drag gesture
    mutate((d) => {
      d.updatedAt = new Date().toISOString();
    });
  }

  return (
    <div className="relative flex h-full flex-col bg-[repeating-conic-gradient(#f0ece4_0%_25%,#f6f3ee_0%_50%)] bg-[length:22px_22px]">
      {/* toolbar */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-1.5">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1 shadow-sm backdrop-blur">
          <IconBtn label="Alejar" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}>
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <span className="w-10 text-center text-xs tabular-nums text-ink-soft">
            {Math.round(zoom * 100)}%
          </span>
          <IconBtn label="Acercar" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Ajustar" onClick={() => setZoom(1)}>
            <Scan className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label="Pantalla completa"
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

      {/* stage */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        <div
          ref={canvasRef}
          onClick={() => {
            select(null);
            setActiveSurface(null);
          }}
          className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[var(--shadow-pop)]"
          style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease" }}
        >
          {project.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.photo}
              alt={project.name}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={project.designFilter ? { filter: project.designFilter } : undefined}
              draggable={false}
            />
          ) : (
            <SurfacePreview project={project} className="absolute inset-0 h-full w-full" />
          )}

          <SurfaceOverlay surface={activeSurface} />

          {objects.map((item) => (
            <CanvasItem
              key={item.id}
              item={item}
              selected={selectedItemId === item.id}
              onSelect={() => select(item.id)}
              onTransform={(patch) => transformItem(item.id, patch)}
              onCommit={commit}
              containerRef={canvasRef}
            />
          ))}

          {project.photo && objects.length === 0 && !activeSurface && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
              Elige una superficie abajo o añade mobiliario desde el panel izquierdo
            </div>
          )}
        </div>
      </div>

      {/* surface picker */}
      <div className="flex items-center justify-center gap-2 border-t border-line bg-surface/80 p-3 backdrop-blur">
        <span className="mr-1 text-xs text-muted">Seleccionar zona:</span>
        {SURFACE_CHIPS.map((c) => {
          const applied = activeItems(project).some(
            (it) => it.kind === "surface" && it.surface === c.key,
          );
          return (
            <button
              key={c.key}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSurface(activeSurface === c.key ? null : c.key);
                select(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                activeSurface === c.key
                  ? "border-clay bg-clay text-white"
                  : "border-line-strong text-ink hover:border-ink/30",
              )}
            >
              {c.label}
              {applied && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    activeSurface === c.key ? "bg-white" : "bg-sage",
                  )}
                />
              )}
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
      style={{
        clipPath: clip,
        background: "rgba(180,83,42,0.28)",
        border: "2px solid rgba(180,83,42,0.7)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
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
