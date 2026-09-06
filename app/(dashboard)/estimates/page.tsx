"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { estimateService } from "@/lib/services/estimate-service";
import { projectService, type ProjectListEntry } from "@/lib/services/project-service";
import { currencyService } from "@/lib/market/currency-service";
import { formatDate } from "@/lib/format";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { countryByCode } from "@/lib/market/data/countries";
import type { Estimate } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Estimate["status"], string> = {
  draft: "Borrador",
  final: "Final",
  approved: "Aprobado",
  archived: "Archivado",
};

export default function EstimatesPage() {
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
      <h1 className="font-serif text-3xl tracking-tight text-ink">Presupuestos</h1>

      {loading ? (
        <Skeleton className="h-64" />
      ) : estimates.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-5 w-5" />}
          title="Todavía no has generado presupuestos"
          description="Genera un presupuesto desde la pantalla Presupuesto de cualquier proyecto para verlo aquí."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Mercado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((e) => {
                const project = projects.find((p) => p.project.id === e.projectId);
                const country = countryByCode(e.countryCode);
                return (
                  <tr key={e.id} className="border-b border-line last:border-0 hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/estimates/${e.id}`} className="font-medium text-ink hover:text-clay">
                        {e.estimateNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{project?.project.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {country?.flag} {e.currencyCode}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          e.status === "approved" ? "bg-sage/15 text-sage" : "bg-line text-ink-soft",
                        )}
                      >
                        {STATUS_LABEL[e.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-ink">
                      {currencyService.format({ amount: e.total, currency: e.currencyCode })}
                    </td>
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
