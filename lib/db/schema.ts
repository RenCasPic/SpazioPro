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
  Room,
} from "@/types";

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
}

export function emptyDatabase(): Database {
  return {
    version: 4,
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
  };
}
