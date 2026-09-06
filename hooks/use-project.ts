"use client";

import { useCallback, useEffect, useState } from "react";
import { projectService, type ProjectListEntry } from "@/lib/services/project-service";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await projectService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    projects,
    loading,
    refresh,
    remove: async (id: string) => {
      await projectService.remove(id);
      await refresh();
    },
  };
}
