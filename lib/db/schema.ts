import type {
  AiJob,
  Client,
  DesignScenario,
  Estimate,
  EstimateSettings,
  LaborLine,
  Profile,
  Project,
  ProjectImage,
  ProjectItem,
  ProjectLocation,
  ReconstructionJob,
  Room,
  RoomCapture,
  RoomModel,
} from "@/types";

export const DB_VERSION = 5;

export interface ProjectConfig {
  projectId: string;
  laborLines: LaborLine[];
  settings: EstimateSettings;
}

export interface Database {
  version: number;
  profile: Profile | null;
  clients: Client[];
  projects: Project[];
  locations: ProjectLocation[];
  rooms: Room[];
  images: ProjectImage[];
  scenarios: DesignScenario[];
  items: ProjectItem[];
  estimates: Estimate[];
  configs: ProjectConfig[];
  aiJobs: AiJob[];
  /** Semantic 3D room models — versioned; latest per room wins */
  roomModels: RoomModel[];
  roomCaptures: RoomCapture[];
  reconstructionJobs: ReconstructionJob[];
}

export function emptyDatabase(): Database {
  return {
    version: DB_VERSION,
    profile: null,
    clients: [],
    projects: [],
    locations: [],
    rooms: [],
    images: [],
    scenarios: [],
    items: [],
    estimates: [],
    configs: [],
    aiJobs: [],
    roomModels: [],
    roomCaptures: [],
    reconstructionJobs: [],
  };
}
