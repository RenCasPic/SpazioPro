"use client";

import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

export function BeforeAfter({
  image,
  designFilter,
}: {
  image: string;
  designFilter?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function move(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl border border-line-strong shadow-[var(--shadow-card)]"
      onPointerDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      {/* design (after) full */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Diseño"
        className="absolute inset-0 h-full w-full object-cover"
        style={designFilter ? { filter: designFilter } : undefined}
        draggable={false}
      />
      {/* original (before) clipped to the left of the handle */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Original"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-white">
        Original
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-clay px-2.5 py-1 text-[11px] font-medium text-white">
        Diseño
      </span>

      <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink shadow-[var(--shadow-pop)]">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
