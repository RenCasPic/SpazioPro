import type { CurrencyCode, MeasurementSystem } from "./market";

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

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  living_room: "Salón",
  bedroom: "Dormitorio",
  kitchen: "Cocina",
  bathroom: "Baño",
  office: "Oficina",
  commercial: "Local comercial",
  terrace: "Terraza",
  exterior: "Exterior",
  whole_home: "Vivienda completa",
  other: "Otro",
};

export type ProjectStatus =
  | "draft"
  | "designing"
  | "estimating"
  | "quoted"
  | "approved"
  | "completed";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Borrador",
  designing: "Diseñando",
  estimating: "Presupuestando",
  quoted: "Cotizado",
  approved: "Aprobado",
  completed: "Completado",
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "draft",
  "designing",
  "estimating",
  "quoted",
  "approved",
  "completed",
];

export type MeasurementSource = "manual" | "ai_estimate" | "mixed";

export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  width: number;
  length: number;
  height: number;
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  perimeter: number;
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
  /** CSS filter descriptor produced by the demo design generator */
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
  countryCode: string;
  currencyCode: CurrencyCode;
  locale: string;
  taxRate: number;
  measurementSystem: MeasurementSystem;
  /** id of the scenario currently open in the editor */
  activeScenarioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewProject {
  name: string;
  clientId: string | null;
  countryCode: string;
  projectType: ProjectType;
  description: string;
}
