import type { Estimate, Project, TakeoffMeasurement } from "@/types";
import { readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";

export interface AttentionEstimate {
  estimate: Estimate;
  projectName: string;
}

export interface AttentionTakeoff {
  measurement: TakeoffMeasurement;
  projectId: string;
  projectName: string;
}

export interface AttentionProject {
  project: Project;
  missing: Array<"location" | "estimate" | "client">;
}

export interface OperationalSummary {
  estimatesNeedingReview: AttentionEstimate[];
  unverifiedTakeoffs: AttentionTakeoff[];
  projectsMissingInfo: AttentionProject[];
}

/** Cross-project "what needs a look" feed for the operational dashboard — real data, no placeholders. */
export const dashboardService = {
  async operationalSummary(): Promise<OperationalSummary> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const projects = db.projects.filter((p) => p.userId === userId);
    const projectIds = new Set(projects.map((p) => p.id));
    const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? "";

    const estimatesNeedingReview = db.estimates
      .filter((e) => projectIds.has(e.projectId) && e.status === "draft")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map((estimate) => ({ estimate, projectName: nameOf(estimate.projectId) }));

    const unverifiedTakeoffs = db.takeoffMeasurements
      .filter((m) => projectIds.has(m.projectId) && m.verificationStatus !== "verified")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map((measurement) => ({
        measurement,
        projectId: measurement.projectId,
        projectName: nameOf(measurement.projectId),
      }));

    const projectsMissingInfo = projects
      .filter((p) => p.status !== "lost" && p.status !== "completed")
      .map((project) => {
        const missing: AttentionProject["missing"] = [];
        if (!db.locations.some((l) => l.projectId === project.id)) missing.push("location");
        if (!project.clientId) missing.push("client");
        if (!db.estimates.some((e) => e.projectId === project.id)) missing.push("estimate");
        return { project, missing };
      })
      .filter((x) => x.missing.length > 0)
      .slice(0, 5);

    return { estimatesNeedingReview, unverifiedTakeoffs, projectsMissingInfo };
  },
};
