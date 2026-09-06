import type { Project, SurfaceKind } from "@/types";
import { productById } from "@/data/catalog";
import { cn } from "@/lib/utils";

function swatchFor(project: Project, surface: SurfaceKind): string | null {
  const item = project.items.find(
    (it) =>
      it.scenarioId === project.activeScenarioId &&
      it.kind === "surface" &&
      it.surface === surface,
  );
  if (!item) return null;
  return productById(item.productId)?.swatch ?? null;
}

/**
 * Schematic one-point-perspective room used as a placeholder when the
 * project has no photo yet, and as the dashboard thumbnail.
 */
export function SurfacePreview({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const floor = swatchFor(project, "floor") ?? "linear-gradient(180deg,#e9e3d8,#d8cfc0)";
  const wall = swatchFor(project, "wall") ?? "linear-gradient(180deg,#f4f1ea,#e8e3d9)";
  const ceiling = swatchFor(project, "ceiling") ?? "linear-gradient(180deg,#f7f5f0,#efece4)";

  return (
    <div className={cn("relative overflow-hidden bg-paper", className)}>
      <div className="absolute inset-0" style={{ background: wall }} />
      {/* ceiling */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: "26%",
          background: ceiling,
          clipPath: "polygon(0 0, 100% 0, 72% 100%, 28% 100%)",
        }}
      />
      {/* floor */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "42%",
          background: floor,
          clipPath: "polygon(28% 0, 72% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* side walls tint for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(28,25,23,0.12))]" />
      <div
        className="absolute left-1/2 top-1/2 h-[34%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/40"
        style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05))" }}
      />
    </div>
  );
}
