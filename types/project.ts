import type { CurrencyCode, MeasurementSystem } from "./market";
import type { Locale } from "@/lib/i18n/config";

export type ProjectType =
  | "living_room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "office"
  | "commercial"
  | "terrace"
  | "exterior"
  | "whole_home"
  | "other";

export const PROJECT_TYPES: ProjectType[] = [
  "kitchen",
  "bathroom",
  "living_room",
  "bedroom",
  "office",
  "commercial",
  "whole_home",
  "exterior",
  "terrace",
  "other",
];

export type ProjectStatus =
  | "draft"
  | "designing"
  | "estimating"
  | "quoted"
  | "approved"
  | "completed";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "draft",
  "designing",
  "estimating",
  "quoted",
  "approved",
  "completed",
];

export type MeasurementSource = "manual" | "ai_estimate" | "mixed";

/** Room dimensions stored in inches internally; UI works in ft + in. */
export interface RoomDimensions {
  /** total inches */
  widthIn: number;
  lengthIn: number;
  heightIn: number;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  /** areas in square feet */
  floorAreaSqFt: number;
  wallAreaSqFt: number;
  ceilingAreaSqFt: number;
  /** perimeter in linear feet */
  perimeterLinFt: number;
  measurementSource: MeasurementSource;
  aiAnalysis: import("./ai").RoomAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectImageType = "original" | "analysis" | "design" | "before_after";

export interface ProjectImage {
  id: string;
  projectId: string;
  roomId: string | null;
  type: ProjectImageType;
  originalUrl: string;
  processedUrl: string | null;
  thumbnailUrl: string | null;
  designFilter?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  clientId: string | null;
  name: string;
  description: string;
  projectType: ProjectType;
  status: ProjectStatus;
  /** frozen per-project market context — global setting changes don't touch this */
  countryCode: string;
  stateCode: string;
  currencyCode: CurrencyCode;
  locale: string;
  measurementSystem: MeasurementSystem;
  /** language the estimate/proposal PDF is rendered in (independent of app UI) */
  estimateLanguage: Locale;
  activeScenarioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewProject {
  name: string;
  clientId: string | null;
  projectType: ProjectType;
  description: string;
  address?: string;
  city: string;
  stateCode: string;
  zipCode: string;
  estimateLanguage: Locale;
}
