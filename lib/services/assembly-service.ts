import type { ProjectItem } from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { ASSEMBLIES, assemblyById } from "@/data/assemblies";
import { productById } from "@/data/catalog";
import { expandAssembly } from "@/lib/calculations/assemblies";
import { itemService } from "./item-service";

export interface ApplyAssemblyParams {
  projectId: string;
  assemblyId: string;
  /** the catalog product chosen to fill the assembly's "primary" slot */
  primaryProductId: string;
  /** quantity in the assembly's baseUnit (e.g. sq ft of the surface) */
  baseQuantity: number;
  surface?: SurfaceKind;
}

/**
 * Expands an Assembly into its component ProjectItems in one call, reusing
 * the existing item-creation path (pricing, labor, auto teardown on a
 * surface) for every line — never a parallel quantity engine.
 */
export const assemblyService = {
  list() {
    return ASSEMBLIES;
  },
  get(id: string) {
    return assemblyById(id);
  },

  async apply(params: ApplyAssemblyParams): Promise<ProjectItem[]> {
    const assembly = assemblyById(params.assemblyId);
    if (!assembly) throw new Error("Assembly not found");

    const lines = expandAssembly({
      assembly,
      baseQuantity: params.baseQuantity,
      primaryProductId: params.primaryProductId,
    });

    const created: ProjectItem[] = [];
    for (const line of lines) {
      const product = productById(line.productId);
      if (!product) continue; // an unresolved accessory never blocks the rest of the assembly
      const item = await itemService.add({
        projectId: params.projectId,
        product,
        surface: line.role === "primary" ? params.surface : undefined,
      });
      await itemService.update(item.id, { quantity: line.quantity, quantityAuto: false });
      created.push({ ...item, quantity: line.quantity, quantityAuto: false });
    }
    return created;
  },
};
