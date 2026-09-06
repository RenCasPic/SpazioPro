"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { estimateService } from "@/lib/services/estimate-service";
import { projectService, type ProjectListEntry } from "@/lib/services/project-service";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { formatUsd, formatDate } from "@/lib/format";
import type { Estimate } from "@/types";

export default function EstimatesPage() {
  const t = useT();
  const locale = useLocale();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<ProjectListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([estimateService.list(), projectService.list()]).then(([e, p]) => {
      setEstimates(e);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="display text-[28px] text-ink">{t("estimates.list_title")}</h1>

      {loading ? (
        <Skeleton className="h-64" />
      ) : estimates.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-5 w-5" />} title={t("common.states.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">{t("common.nav.projects")}</th>
                <th className="px-4 py-3 font-medium">{t("projects.new.state")}</th>
                <th className="px-4 py-3 font-medium">{t("estimates.settings.notes")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("estimates.table.total")}</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((e) => {
                const project = projects.find((p) => p.project.id === e.projectId);
                return (
                  <tr key={e.id} className="border-b border-line last:border-0 hover:bg-paper">
                    <td className="px-4 py-3">
                      <LocaleLink href={`/estimates/${e.id}`} className="font-medium text-ink hover:text-clay">
                        {e.estimateNumber}
                      </LocaleLink>
                      <span className="ml-1.5 rounded bg-line px-1 py-px text-[10px] text-ink-soft">{e.kind}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{project?.project.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{e.stateCode}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(e.createdAt, locale)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-ink">{formatUsd(e.total, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

