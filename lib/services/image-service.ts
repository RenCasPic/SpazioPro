import type { ProjectImage, ProjectImageType } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { uid } from "@/lib/utils";

export const imageService = {
  async listForProject(projectId: string): Promise<ProjectImage[]> {
    await getCurrentUserId();
    return readDb().images.filter((i) => i.projectId === projectId);
  },

  async original(projectId: string): Promise<ProjectImage | null> {
    await getCurrentUserId();
    return readDb().images.find((i) => i.projectId === projectId && i.type === "original") ?? null;
  },

  async addOriginal(projectId: string, roomId: string | null, dataUrl: string): Promise<ProjectImage> {
    const now = new Date().toISOString();
    const image: ProjectImage = {
      id: uid("img"),
      projectId,
      roomId,
      type: "original",
      originalUrl: dataUrl,
      processedUrl: null,
      thumbnailUrl: null,
      metadata: {},
      createdAt: now,
    };
    mutateDb((db) => {
      db.images = db.images.filter((i) => !(i.projectId === projectId && i.type === "original"));
      db.images.push(image);
    });
    return image;
  },

  async setDesignFilter(projectId: string, cssFilter: string): Promise<void> {
    mutateDb((db) => {
      const image = db.images.find((i) => i.projectId === projectId && i.type === "original");
      if (image) image.designFilter = cssFilter;
    });
  },

  async add(
    projectId: string,
    type: ProjectImageType,
    dataUrl: string,
    metadata: Record<string, unknown> = {},
  ): Promise<ProjectImage> {
    const image: ProjectImage = {
      id: uid("img"),
      projectId,
      roomId: null,
      type,
      originalUrl: dataUrl,
      processedUrl: null,
      thumbnailUrl: null,
      metadata,
      createdAt: new Date().toISOString(),
    };
    mutateDb((db) => db.images.push(image));
    return image;
  },
};
