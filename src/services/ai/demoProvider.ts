import type { RoomType, VisionResult } from "@/types";
import type {
  AIProvider,
  EstimationInput,
  EstimationResult,
  ImageEditInput,
  ImageEditResult,
  VisionInput,
} from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROOM_GUESSES: RoomType[] = [
  "living_room",
  "kitchen",
  "bathroom",
  "bedroom",
  "office",
];

/**
 * Fully offline provider. Produces plausible, deterministic-ish results so the
 * whole product is demoable without any API key. Swap for a real provider by
 * setting AI_PROVIDER and implementing `AIProvider`.
 */
export const demoProvider: AIProvider = {
  id: "demo",
  isDemo: true,

  async analyzeRoom({ hintRoomType, image }: VisionInput): Promise<VisionResult> {
    await wait(2200);
    const roomType =
      hintRoomType && hintRoomType !== "other"
        ? hintRoomType
        : ROOM_GUESSES[hashString(image) % ROOM_GUESSES.length];

    const base = {
      living_room: { objects: ["Sofá", "Mesa de centro", "Estantería", "Lámpara de pie", "TV", "Alfombra"], w: 4.2, l: 5.1, h: 2.6 },
      kitchen: { objects: ["Muebles bajos", "Muebles altos", "Campana", "Frigorífico", "Mesa"], w: 3.4, l: 4.0, h: 2.6 },
      bathroom: { objects: ["Lavabo", "Inodoro", "Bañera", "Espejo"], w: 2.1, l: 2.8, h: 2.5 },
      bedroom: { objects: ["Cama", "Mesillas", "Armario", "Cómoda"], w: 3.4, l: 3.8, h: 2.6 },
      office: { objects: ["Escritorio", "Silla", "Estantería", "Archivador"], w: 3.0, l: 3.6, h: 2.7 },
      retail: { objects: ["Mostrador", "Expositores", "Iluminación de raíl"], w: 5.0, l: 8.0, h: 3.2 },
      terrace: { objects: ["Mesa exterior", "Sillas", "Jardineras"], w: 3.0, l: 4.0, h: 2.8 },
      other: { objects: ["Mobiliario"], w: 3.5, l: 4.5, h: 2.6 },
    }[roomType];

    return {
      room_type: roomType,
      surfaces: [
        { kind: "floor", label: "Suelo", confidence: 0.94 },
        { kind: "wall", label: "Pared frontal", confidence: 0.9 },
        { kind: "wall", label: "Pared izquierda", confidence: 0.86 },
        { kind: "wall", label: "Pared derecha", confidence: 0.83 },
        { kind: "ceiling", label: "Techo", confidence: 0.8 },
      ],
      objects: base.objects.map((label, i) => ({ label, confidence: 0.7 + ((i * 7) % 20) / 100 })),
      dimensions_estimate: { width: base.w, length: base.l, height: base.h, estimated: true },
      summary: `Hemos detectado 4 paredes, suelo, techo y ${base.objects.length} elementos de mobiliario.`,
    };
  },

  async generateDesign({ productSwatch, surface, productName }: ImageEditInput): Promise<ImageEditResult> {
    await wait(1600);
    // Demo: derive a subtle color-grade from the swatch so the preview shifts.
    const tint = extractFirstColor(productSwatch);
    const filter =
      surface === "floor"
        ? "saturate(1.08) contrast(1.04) brightness(1.02)"
        : surface === "wall"
          ? "saturate(1.05) contrast(1.02) brightness(1.03) hue-rotate(-4deg)"
          : "saturate(1.04) brightness(1.02)";
    return {
      cssFilter: filter,
      note: `Vista previa demo: "${productName}" aplicado a ${surfaceLabel(surface)}. Con un proveedor de IA real aquí se generaría una imagen fotorrealista conservando perspectiva, sombras y reflejos (tono base ${tint}).`,
    };
  },

  async estimate({ materialCategories }: EstimationInput): Promise<EstimationResult> {
    await wait(600);
    const wastePctByCategory: Record<string, number> = {};
    for (const c of materialCategories) {
      wastePctByCategory[c] =
        c === "tile" || c === "stone" ? 12 : c === "paint" ? 5 : 10;
    }
    return {
      wastePctByCategory,
      suggestedLaborHours: 24,
      disclaimer:
        "Estimación orientativa generada en modo demo. Los precios y cantidades pueden variar según proveedor, mediciones reales, condiciones del espacio y mano de obra.",
    };
  },
};

function surfaceLabel(s?: string) {
  return s === "floor" ? "el suelo" : s === "wall" ? "la pared" : s === "ceiling" ? "el techo" : "la zona seleccionada";
}

function extractFirstColor(swatch: string): string {
  const m = swatch.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/);
  return m ? m[0] : "#cccccc";
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 2048); i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
