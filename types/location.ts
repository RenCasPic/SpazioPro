export interface ProjectLocation {
  id: string;
  projectId: string;
  address: string;
  city: string;
  state: string; // full name
  stateCode: string;
  county: string | null;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewLocation {
  address?: string;
  city: string;
  stateCode: string;
  zipCode: string;
}
