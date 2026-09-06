import type { DesignResult, Product } from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { getAIProvider } from "./provider";

export const imageGeneration = {
  applyMaterial(params: {
    imageUrl: string;
    product: Product;
    surface?: SurfaceKind;
  }): Promise<DesignResult> {
    const { imageUrl, product, surface } = params;
    return getAIProvider().generateDesign({
      imageUrl,
      surface,
      productName: product.name,
      productSwatch: product.swatch,
      instruction: `Sustituye ${surfaceLabel(surface)} por ${product.name} (${product.color}, ${product.style}). Conserva perspectiva, escala, sombras, iluminación y reflejos.`,
    });
  },
  get isDemo() {
    return getAIProvider().isDemo;
  },
};

function surfaceLabel(s?: SurfaceKind) {
  return s === "floor" ? "el suelo" : s === "wall" ? "las paredes" : s === "ceiling" ? "el techo" : "la superficie seleccionada";
}
