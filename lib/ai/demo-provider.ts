import type {
  AiEstimationInput,
  AiEstimationResult,
  DesignInput,
  DesignResult,
  ProjectType,
  RoomAnalysis,
  SegmentationResult,
} from "@/types";
import { PRICE_DISCLAIMER } from "@/lib/constants";
import type { AIProvider } from "./provider";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROOM_PRESETS: Record<
  ProjectType,
  { objects: string[]; w: number; l: number; h: number }
> = {
  living_room: { objects: ["Sofá", "Mesa de centro", "Estantería", "Lámpara de pie", "TV", "Alfombra"], w: 4.2, l: 5.1, h: 2.6 },
  kitchen: { objects: ["Muebles bajos", "Muebles altos", "Campana", "Frigorífico", "Mesa"], w: 3.4, l: 4.0, h: 2.6 },
  bathroom: { objects: ["Lavabo", "Inodoro", "Bañera", "Espejo"], w: 2.1, l: 2.8, h: 2.5 },
  bedroom: { objects: ["Cama", "Mesillas", "Armario", "Cómoda"], w: 3.4, l: 3.8, h: 2.6 },
  office: { objects: ["Escritorio", "Silla", "Estantería", "Archivador"], w: 3.0, l: 3.6, h: 2.7 },
  commercial: { objects: ["Mostrador", "Expositores", "Iluminación de raíl"], w: 5.0, l: 8.0, h: 3.2 },
  terrace: { objects: ["Mesa exterior", "Sillas", "Jardineras"], w: 3.0, l: 4.0, h: 2.8 },
  exterior: { objects: ["Pavimento", "Vegetación"], w: 6.0, l: 8.0, h: 3.0 },
  whole_home: { objects: ["Salón", "Cocina", "Dormitorios", "Baños"], w: 8.0, l: 10.0, h: 2.6 },
  other: { objects: ["Mobiliario"], w: 3.5, l: 4.5, h: 2.6 },
};

const GUESSES: ProjectType[] = ["living_room", "kitchen", "bathroom", "bedroom", "office"];

export const demoProvider: AIProvider = {
  id: "demo",
  isDemo: true,

  async analyzeRoom(imageUrl, hint): Promise<RoomAnalysis> {
    await wait(2200);
    const roomType =
      (hint as ProjectType) && hint !== "other" && ROOM_PRESETS[hint as ProjectType]
        ? (hint as ProjectType)
        : GUESSES[hashString(imageUrl) % GUESSES.length];
    const preset = ROOM_PRESETS[roomType];
    return {
      roomType,
      confidence: 0.82,
      surfaces: [
        { type: "floor", label: "Suelo", confidence: 0.94 },
        { type: "wall", label: "Pared frontal", confidence: 0.9 },
        { type: "wall", label: "Pared izquierda", confidence: 0.86 },
        { type: "wall", label: "Pared derecha", confidence: 0.83 },
        { type: "ceiling", label: "Techo", confidence: 0.8 },
        { type: "window", label: "Ventana", confidence: 0.77 },
      ],
      objects: preset.objects.map((label, i) => ({
        type: label.toLowerCase(),
        label,
        confidence: 0.68 + ((i * 7) % 22) / 100,
        boundingBox: { x: 0.1 + (i % 3) * 0.28, y: 0.45, width: 0.22, height: 0.3 },
      })),
      approximateDimensions: { width: preset.w, length: preset.l, height: preset.h },
      summary: `Hemos detectado 4 paredes, suelo, techo, 1 ventana y ${preset.objects.length} elementos de mobiliario.`,
      isEstimate: true,
    };
  },

  async segment(_imageUrl, target): Promise<SegmentationResult> {
    await wait(700);
    const polygon =
      target === "floor"
        ? [
            { x: 0.12, y: 0.58 },
            { x: 0.88, y: 0.58 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
          ]
        : target === "ceiling"
          ? [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 0.88, y: 0.34 },
              { x: 0.12, y: 0.34 },
            ]
          : [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 1, y: 1 },
              { x: 0, y: 1 },
            ];
    return { target, polygon, confidence: 0.8 };
  },

  async generateDesign({ surface, productName, productSwatch }: DesignInput): Promise<DesignResult> {
    await wait(1500);
    const tint = productSwatch.match(/#[0-9a-fA-F]{3,8}/)?.[0] ?? "#cccccc";
    const cssFilter =
      surface === "floor"
        ? "saturate(1.08) contrast(1.04) brightness(1.02)"
        : surface === "wall"
          ? "saturate(1.05) contrast(1.02) brightness(1.03) hue-rotate(-4deg)"
          : "saturate(1.04) brightness(1.02)";
    return {
      cssFilter,
      note: `Vista previa demo: "${productName}" aplicado a ${label(surface)} (tono base ${tint}). Con un proveedor real se generaría un render fotorrealista conservando perspectiva, sombras y reflejos.`,
    };
  },

  async estimate({ materialCategories, roomType }: AiEstimationInput): Promise<AiEstimationResult> {
    await wait(600);
    const wastePercentByCategory: Record<string, number> = {};
    for (const c of materialCategories) {
      wastePercentByCategory[c] = c === "tile" || c === "stone" ? 12 : c === "paint" ? 5 : c === "wood" ? 8 : 10;
    }
    return {
      wastePercentByCategory,
      suggestedLaborHours: 24,
      suggestedItems: [
        { label: "Preparación de superficies", category: "general", quantity: 1, unit: "global" },
        { label: `Acabados ${roomType}`, category: "painting", quantity: 1, unit: "global" },
      ],
      disclaimer: PRICE_DISCLAIMER,
    };
  },
};

function label(s?: string) {
  return s === "floor" ? "el suelo" : s === "wall" ? "las paredes" : s === "ceiling" ? "el techo" : "la zona seleccionada";
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 2048); i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
