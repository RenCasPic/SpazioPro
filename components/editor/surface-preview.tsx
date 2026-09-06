import type { ProjectBundle } from "@/lib/services/project-service";
import type { SurfaceKind } from "@/lib/constants";
import { productById } from "@/data/catalog";
import { cn } from "@/lib/utils";

function swatch(bundle: ProjectBundle, surface: SurfaceKind): string | null {
  const item = bundle.items.find(
    (i) =>
      i.scenarioId === bundle.project.activeScenarioId &&
      i.kind === "surface" &&
      i.surface === surface,
  );
  return item ? productById(item.productId)?.swatch ?? null : null;
}

/** Schematic one-point-perspective room used when there is no photo. */
export function SurfacePreview({ bundle, className }: { bundle: ProjectBundle; className?: string }) {
  const floor = swatch(bundle, "floor") ?? "linear-gradient(180deg,#e9e3d8,#d8cfc0)";
  const wall = swatch(bundle, "wall") ?? "linear-gradient(180deg,#f4f1ea,#e8e3d9)";
  const ceiling = swatch(bundle, "ceiling") ?? "linear-gradient(180deg,#f7f5f0,#efece4)";

  return (
    <div className={cn("relative overflow-hidden bg-paper", className)}>
      <div className="absolute inset-0" style={{ background: wall }} />
      <div
        className="absolute left-0 right-0 top-0"
        style={{ height: "26%", background: ceiling, clipPath: "polygon(0 0, 100% 0, 72% 100%, 28% 100%)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: "42%", background: floor, clipPath: "polygon(28% 0, 72% 0, 100% 100%, 0 100%)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(28,25,23,0.12))]" />
    </div>
  );
}
