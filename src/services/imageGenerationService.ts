import type { Product, SurfaceKind } from "@/types";
import { getAIProvider, type ImageEditResult } from "./ai";

export const imageGenerationService = {
  async applyMaterial(params: {
    image: string;
    product: Product;
    surface?: SurfaceKind;
  }): Promise<ImageEditResult> {
    const { image, product, surface } = params;
    return getAIProvider().generateDesign({
      image,
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
