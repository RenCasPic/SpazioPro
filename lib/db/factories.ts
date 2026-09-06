import type {
  DesignScenario,
  EstimateSettings,
  NewProject,
  Profile,
  Project,
  ProjectLocation,
  Room,
  RoomDimensions,
  ScenarioType,
} from "@/types";
import { uid } from "@/lib/utils";
import { stateService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";
import { surfaceAreas } from "@/lib/calculations/dimensions";
import { defaultLaborLines } from "@/data/labor";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import type { ProjectConfig } from "./schema";

export function defaultSettings(salesTaxRate: number): EstimateSettings {
  return {
    salesTaxRate,
    discountPercent: 0,
    extras: { equipment: 0, delivery: 0, disposal: 0, permits: 0, other: 0 },
    scopeOfWork: "",
    notes: "",
  };
}

const SCENARIO_NAMES: Record<ScenarioType, string> = {
  economy: "Economy",
  standard: "Standard",
  premium: "Premium",
  custom: "Custom",
};

export function createScenario(projectId: string, type: ScenarioType, name?: string): DesignScenario {
  const now = new Date().toISOString();
  return {
    id: uid("scn"),
    projectId,
    name: name ?? SCENARIO_NAMES[type],
    description: "",
    type,
    totalEstimate: 0,
    currencyCode: "USD",
    previewImageUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Default room ≈ 12 ft × 15 ft × 9 ft. */
export function createRoom(projectId: string, dims: RoomDimensions, name = "Main space"): Room {
  const now = new Date().toISOString();
  const a = surfaceAreas(dims);
  return {
    id: uid("room"),
    projectId,
    name,
    widthIn: dims.widthIn,
    lengthIn: dims.lengthIn,
    heightIn: dims.heightIn,
    floorAreaSqFt: a.floorAreaSqFt,
    wallAreaSqFt: a.wallAreaSqFt,
    ceilingAreaSqFt: a.ceilingAreaSqFt,
    perimeterLinFt: a.perimeterLinFt,
    measurementSource: "ai_estimate",
    aiAnalysis: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLocation(projectId: string, input: NewProject): ProjectLocation {
  const now = new Date().toISOString();
  const state = stateService.get(input.stateCode);
  return {
    id: uid("loc"),
    projectId,
    address: input.address ?? "",
    city: input.city,
    state: state?.name ?? input.stateCode,
    stateCode: input.stateCode.toUpperCase(),
    county: null,
    zipCode: input.zipCode,
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
  };
}

export interface CreatedProject {
  project: Project;
  location: ProjectLocation;
  room: Room;
  scenarios: DesignScenario[];
  config: ProjectConfig;
}

export function createProject(userId: string, input: NewProject): CreatedProject {
  const now = new Date().toISOString();
  const id = uid("prj");
  const stateCode = input.stateCode.toUpperCase();

  const tax = taxService.getTaxRate({ stateCode, city: input.city, zipCode: input.zipCode });

  const scenarios = [
    createScenario(id, "standard"),
    createScenario(id, "economy"),
    createScenario(id, "premium"),
  ];

  const dims: RoomDimensions = { widthIn: 12 * 12, lengthIn: 15 * 12, heightIn: 9 * 12 };
  const room = createRoom(id, dims);

  const project: Project = {
    id,
    userId,
    clientId: input.clientId,
    name: input.name.trim() || "Untitled Project",
    description: input.description,
    projectType: input.projectType,
    status: "draft",
    countryCode: "US",
    stateCode,
    currencyCode: "USD",
    locale: "en-US",
    measurementSystem: "imperial",
    estimateLanguage: input.estimateLanguage ?? DEFAULT_LOCALE,
    activeScenarioId: scenarios[0].id,
    createdAt: now,
    updatedAt: now,
  };

  const config: ProjectConfig = {
    projectId: id,
    laborLines: defaultLaborLines(stateCode),
    settings: defaultSettings(tax.rate),
  };

  return { project, location: createLocation(id, input), room, scenarios, config };
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
    countryCode: "US",
    defaultStateCode: "TX",
    defaultZip: "",
    city: "",
    address: "",
    currencyCode: "USD",
    measurementSystem: "imperial",
    appLanguage: "en-US",
    estimateLanguage: "en-US",
    licenseNumber: "",
    website: "",
    terms:
      "Estimate valid for 30 days. Payment: 40% on acceptance, 40% at midpoint, 20% on completion. Permits and municipal fees not included unless stated.",
    professionalType: "general_contractor",
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}
