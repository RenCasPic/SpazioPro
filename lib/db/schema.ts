import type {
  AiJob,
  Client,
  DesignScenario,
  Estimate,
  Profile,
  Project,
  ProjectImage,
  ProjectItem,
  Room,
} from "@/types";
import type { LaborLine, EstimateSettings } from "@/types";

/** Per-project editor/budget config kept alongside the domain rows. */
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
    version: 2,
    profile: null,
    clients: [],
    projects: [],
    rooms: [],
    images: [],
    scenarios: [],
    items: [],
    estimates: [],
    configs: [],
    aiJobs: [],
  };
}
