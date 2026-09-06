"use client";

import { useRef } from "react";
import { RotateCw, Maximize2, Move } from "lucide-react";
import type { EditorTransform, ProjectItem } from "@/types";
import { productById } from "@/data/catalog";
import { cn } from "@/lib/utils";

type Mode = "move" | "rotate" | "scale" | null;

export function CanvasObject({
  item,
  selected,
  onSelect,
  onTransform,
  onCommit,
  containerRef,
}: {
  item: ProjectItem;
  selected: boolean;
  onSelect: () => void;
  onTransform: (patch: Partial<EditorTransform>) => void;
  onCommit: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const product = productById(item.productId);
  const sprite = product?.sprite ?? "📦";
  const t = item.transform;
  const mode = useRef<Mode>(null);
  const start = useRef({ px: 0, py: 0, x: 0, y: 0, scale: 1, rotation: 0, cx: 0, cy: 0 });

  const rect = () => containerRef.current?.getBoundingClientRect();

  function down(e: React.PointerEvent, m: Mode) {
    e.stopPropagation();
    onSelect();
    const r = rect();
    if (!r) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    mode.current = m;
    start.current = {
      px: e.clientX,
      py: e.clientY,
      x: t.x,
      y: t.y,
      scale: t.scale,
      rotation: t.rotation,
      cx: r.left + t.x * r.width,
      cy: r.top + t.y * r.height,
    };
  }

  function move(e: React.PointerEvent) {
    if (!mode.current) return;
    const r = rect();
    if (!r) return;
    const s = start.current;
    if (mode.current === "move") {
      onTransform({
        x: clamp(s.x + (e.clientX - s.px) / r.width, 0.02, 0.98),
        y: clamp(s.y + (e.clientY - s.py) / r.height, 0.02, 0.98),
      });
    } else if (mode.current === "rotate") {
      const ang = Math.atan2(e.clientY - s.cy, e.clientX - s.cx) * (180 / Math.PI);
      onTransform({ rotation: Math.round(ang + 90) });
    } else {
      const d0 = Math.hypot(s.px - s.cx, s.py - s.cy) || 1;
      const d1 = Math.hypot(e.clientX - s.cx, e.clientY - s.cy);
      onTransform({ scale: clamp((s.scale * d1) / d0, 0.3, 4) });
    }
  }

  function up(e: React.PointerEvent) {
    if (mode.current) onCommit();
    mode.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
      onPointerMove={move}
      onPointerUp={up}
    >
      <div style={{ transform: `rotate(${t.rotation}deg) scale(${t.scale})` }} className="relative">
        <button
          onPointerDown={(e) => down(e, "move")}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "grid h-16 w-16 cursor-move place-items-center rounded-2xl border bg-surface/95 text-3xl shadow-[var(--shadow-pop)] backdrop-blur",
            selected ? "border-clay ring-2 ring-clay/30" : "border-line hover:border-ink/30",
          )}
          title={item.name}
        >
          <span aria-hidden>{sprite}</span>
        </button>
        {selected && (
          <>
            <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
              {item.name}
            </span>
            <button
              onPointerDown={(e) => down(e, "rotate")}
              className="absolute -top-9 left-1/2 grid h-6 w-6 -translate-x-1/2 cursor-grab place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm"
              title="Rotar"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onPointerDown={(e) => down(e, "scale")}
              className="absolute -bottom-3 -right-3 grid h-6 w-6 cursor-nwse-resize place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm"
              title="Escalar"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <span className="absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm">
              <Move className="h-3.5 w-3.5" />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
