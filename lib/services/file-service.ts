import type { ProjectFile, ProjectFileKind } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { uid } from "@/lib/utils";

/** Demo mode stores files as data URLs in localStorage — keep them small. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const KIND_BY_EXT: Record<string, ProjectFileKind> = {
  pdf: "pdf",
  docx: "docx",
  doc: "docx",
  xlsx: "xlsx",
  xls: "xlsx",
  csv: "csv",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

export function kindForFile(name: string): ProjectFileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return KIND_BY_EXT[ext] ?? "other";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read the file."));
    reader.readAsDataURL(file);
  });
}

async function assertOwner(projectId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId);
  if (!project || project.userId !== userId) throw new Error("Project not found");
}

/**
 * Documents that give a project context — specs, scope of work, schedules,
 * bid documents. Phase 2 reads these as takeoff source material; Phase 1 just
 * stores, lists and lets the user open/download them.
 */
export const fileService = {
  async list(projectId: string): Promise<ProjectFile[]> {
    await assertOwner(projectId);
    return readDb()
      .projectFiles.filter((f) => f.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async upload(projectId: string, file: File): Promise<ProjectFile> {
    await assertOwner(projectId);
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("File is too large for demo mode (max 8 MB). Configure Supabase Storage for larger files.");
    }
    const url = await readAsDataUrl(file);
    const record: ProjectFile = {
      id: uid("pfi"),
      projectId,
      name: file.name,
      kind: kindForFile(file.name),
      url,
      sizeBytes: file.size,
      notes: "",
      createdAt: new Date().toISOString(),
    };
    mutateDb((db) => db.projectFiles.push(record));
    return record;
  },

  async remove(id: string): Promise<void> {
    mutateDb((db) => {
      db.projectFiles = db.projectFiles.filter((f) => f.id !== id);
    });
  },
};
