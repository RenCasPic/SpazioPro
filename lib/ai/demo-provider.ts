import type {
  AiEstimationInput,
  AiEstimationResult,
  DesignInput,
  DesignResult,
  ProjectType,
  RoomAnalysis,
  SegmentationResult,
} from "@/types";
import type { AIProvider } from "./provider";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ft = (feet: number, inches = 0) => feet * 12 + inches;

const ROOM_PRESETS: Record<
  ProjectType,
  { objects: string[]; w: number; l: number; h: number }
> = {
  living_room: { objects: ["Sofa", "Coffee table", "Bookshelf", "Floor lamp", "TV", "Area rug"], w: ft(14), l: ft(17), h: ft(9) },
  kitchen: { objects: ["Base cabinets", "Wall cabinets", "Range hood", "Refrigerator", "Island"], w: ft(11), l: ft(13), h: ft(9) },
  bathroom: { objects: ["Vanity", "Toilet", "Bathtub", "Mirror"], w: ft(7), l: ft(9), h: ft(8) },
  bedroom: { objects: ["Bed", "Nightstands", "Dresser", "Closet"], w: ft(11), l: ft(12), h: ft(9) },
  office: { objects: ["Desk", "Chair", "Bookshelf", "Filing cabinet"], w: ft(10), l: ft(12), h: ft(9) },
  commercial: { objects: ["Counter", "Displays", "Track lighting"], w: ft(16), l: ft(26), h: ft(11) },
  terrace: { objects: ["Outdoor table", "Chairs", "Planters"], w: ft(10), l: ft(13), h: ft(9) },
  exterior: { objects: ["Paving", "Landscaping"], w: ft(20), l: ft(26), h: ft(10) },
  whole_home: { objects: ["Living", "Kitchen", "Bedrooms", "Baths"], w: ft(26), l: ft(33), h: ft(9) },
  other: { objects: ["Furniture"], w: ft(12), l: ft(14), h: ft(9) },
};

const GUESSES: ProjectType[] = ["kitchen", "bathroom", "living_room", "bedroom", "office"];

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
        { type: "floor", label: "Floor", confidence: 0.94 },
        { type: "wall", label: "Front wall", confidence: 0.9 },
        { type: "wall", label: "Left wall", confidence: 0.86 },
        { type: "wall", label: "Right wall", confidence: 0.83 },
        { type: "ceiling", label: "Ceiling", confidence: 0.8 },
        { type: "window", label: "Window", confidence: 0.77 },
      ],
      objects: preset.objects.map((label, i) => ({
        type: label.toLowerCase(),
        label,
        confidence: 0.68 + ((i * 7) % 22) / 100,
        boundingBox: { x: 0.1 + (i % 3) * 0.28, y: 0.45, width: 0.22, height: 0.3 },
      })),
      approximateDimensions: { widthIn: preset.w, lengthIn: preset.l, heightIn: preset.h },
      summary: `Detected 4 walls, floor, ceiling, 1 window and ${preset.objects.length} furniture items.`,
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
      note: `Demo preview: "${productName}" applied to the ${surface ?? "selected area"} (base tone ${tint}). A real provider would render a photorealistic result preserving perspective, shadows and reflections.`,
    };
  },

  async estimate({ materialCategories, roomType }: AiEstimationInput): Promise<AiEstimationResult> {
    await wait(600);
    const wastePercentByCategory: Record<string, number> = {};
    for (const c of materialCategories) {
      wastePercentByCategory[c] = /tile|stone|backsplash/.test(c) ? 12 : /paint/.test(c) ? 5 : /wood|hardwood|lvp|laminate/.test(c) ? 8 : 10;
    }
    return {
      wastePercentByCategory,
      suggestedLaborHours: 24,
      suggestedItems: [
        { label: "Surface prep", category: "general_labor", quantity: 1, unit: "project" },
        { label: `${roomType} finish work`, category: "finish_carpentry", quantity: 1, unit: "project" },
      ],
      disclaimer:
        "This estimate is for planning purposes only. Actual costs may vary based on verified measurements, site conditions, material availability, supplier pricing, labor requirements, permits, and local taxes.",
    };
  },
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 2048); i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
