"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { seg: "", label: "Resumen" },
  { seg: "editor", label: "Editor" },
  { seg: "images", label: "Imágenes" },
  { seg: "budget", label: "Presupuesto" },
  { seg: "scenarios", label: "Escenarios" },
  { seg: "settings", label: "Configuración" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const active = t.seg
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={t.seg || "resumen"}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-clay text-ink"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
