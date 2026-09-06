import type { Dimensions, RoomType } from "@/types";
import { getAIProvider, type EstimationResult } from "./ai";

export const estimationService = {
  async suggest(params: {
    roomType: RoomType;
    dimensions: Dimensions;
    materialCategories: string[];
    objectCount: number;
  }): Promise<EstimationResult> {
    return getAIProvider().estimate(params);
  },
  get isDemo() {
    return getAIProvider().isDemo;
  },
};

export const PRICE_DISCLAIMER =
  "Estimación orientativa. Los precios y cantidades pueden variar según proveedor, mediciones reales, condiciones del espacio y mano de obra.";
