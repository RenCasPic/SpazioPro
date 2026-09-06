import type {
  DesignScenario,
  EstimateSettings,
  NewProject,
  Profile,
  Project,
  Room,
  RoomDimensions,
  ScenarioType,
} from "@/types";
import { uid } from "@/lib/utils";
import { countryService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";
import { surfaceAreas } from "@/lib/calculations/quantities";
import { defaultLaborLines } from "@/data/labor";
import type { ProjectConfig } from "./schema";

export function defaultSettings(): EstimateSettings {
  return {
    vatRate: 21,
    discountPercent: 0,
    transport: { enabled: true, distanceKm: 15, volumeM3: 6, manualOverride: null },
    notes: "",
  };
}

export function createScenario(projectId: string, type: ScenarioType, name?: string): DesignScenario {
  const now = new Date().toISOString();
  const labels: Record<ScenarioType, string> = {
    economy: "Económico",
    standard: "Estándar",
    premium: "Premium",
    custom: "Personalizado",
  };
  return {
    id: uid("scn"),
    projectId,
    name: name ?? labels[type],
    description: "",
    type,
    totalEstimate: 0,
    currencyCode: "EUR",
    previewImageUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createRoom(projectId: string, dims: RoomDimensions, name = "Espacio principal"): Room {
  const now = new Date().toISOString();
  const a = surfaceAreas(dims);
  return {
    id: uid("room"),
    projectId,
    name,
    width: dims.width,
    length: dims.length,
    height: dims.height,
    floorArea: a.floorArea,
    wallArea: a.wallArea,
    ceilingArea: a.ceilingArea,
    perimeter: a.perimeter,
    measurementSource: "ai_estimate",
    aiAnalysis: null,
    createdAt: now,
    updatedAt: now,
  };
}

export interface CreatedProject {
  project: Project;
  room: Room;
  scenarios: DesignScenario[];
  config: ProjectConfig;
}

export function createProject(userId: string, input: NewProject): CreatedProject {
  const country = countryService.require(input.countryCode);
  const now = new Date().toISOString();
  const id = uid("prj");

  const scenarios = [
    createScenario(id, "standard"),
    createScenario(id, "economy"),
    createScenario(id, "premium"),
  ].map((s) => ({ ...s, currencyCode: country.currencyCode }));

  const dims: RoomDimensions = { width: 4, length: 5, height: 2.6 };
  const room = createRoom(id, dims);
  room.projectId = id;

  const project: Project = {
    id,
    userId,
    clientId: input.clientId,
    name: input.name.trim() || "Proyecto sin título",
    description: input.description,
    projectType: input.projectType,
    status: "draft",
    countryCode: country.code,
    currencyCode: country.currencyCode,
    locale: country.locale,
    taxRate: taxService.defaultRate(country.code),
    measurementSystem: country.measurementSystem,
    activeScenarioId: scenarios[0].id,
    createdAt: now,
    updatedAt: now,
  };

  const config: ProjectConfig = {
    projectId: id,
    laborLines: defaultLaborLines(country.code),
    settings: { ...defaultSettings(), vatRate: project.taxRate },
  };

  return { project, room, scenarios, config };
}

export function createProfile(id: string, email: string): Profile {
  const now = new Date().toISOString();
  return {
    id,
    fullName: "",
    companyName: "",
    phone: "",
    email,
    avatarUrl: null,
    logoUrl: null,
    countryCode: "ES",
    currencyCode: "EUR",
    locale: "es-ES",
    city: "",
    address: "",
    taxId: "",
    website: "",
    terms:
      "Presupuesto válido durante 30 días. Forma de pago: 40% a la aceptación, 40% a mitad de obra, 20% a la entrega. No incluye licencias ni tasas municipales salvo indicación expresa.",
    defaultTaxRate: 21,
    professionalType: "interior_designer",
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}
