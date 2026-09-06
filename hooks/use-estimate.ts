"use client";

import { useCallback, useEffect, useState } from "react";
import type { EstimateTotals } from "@/types";
import { estimateService, type LiveEstimate } from "@/lib/services/estimate-service";

export function useLiveEstimate(projectId: string | undefined, scenarioId?: string, dep?: unknown) {
  const [data, setData] = useState<LiveEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setData(await estimateService.computeLive(projectId, scenarioId));
    } finally {
      setLoading(false);
    }
  }, [projectId, scenarioId]);

  useEffect(() => {
    void refresh();
  }, [refresh, dep]);

  return { data, loading, refresh };
}

export function useScenarioTotals(projectId: string | undefined, scenarioIds: string[], dep?: unknown) {
  const [totals, setTotals] = useState<Record<string, EstimateTotals>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!projectId) return;
      const entries = await Promise.all(
        scenarioIds.map(async (id) => [id, await estimateService.totalsForScenario(projectId, id)] as const),
      );
      if (alive) setTotals(Object.fromEntries(entries.filter(([, t]) => t) as [string, EstimateTotals][]));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, scenarioIds.join(","), dep]);

  return totals;
}
