"use client";

import { useEffect, useMemo, useState } from "react";
import { Ruler, Search, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { TakeoffMeasurement, TakeoffVerificationStatus } from "@/types";
import { useProjects } from "@/hooks/use-project";
import { takeoffService } from "@/lib/services/takeoff-service";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/table";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { SCOPE_CATEGORY_KEY } from "@/data/scopes";
import { UNIT_KEYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | "needs_review" | "verified";

const STATUS_ICON: Record<TakeoffVerificationStatus, typeof ShieldCheck> = {
  verified: ShieldCheck,
  needs_verification: ShieldAlert,
  unverified: ShieldQuestion,
};

const STATUS_TONE: Record<TakeoffVerificationStatus, "ok" | "warn" | "slate"> = {
  verified: "ok",
  needs_verification: "warn",
  unverified: "slate",
};

export default function TakeoffsPage() {
  const t = useT();
  const locale = useLocale();
  const router = useLocaleRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const [measurements, setMeasurements] = useState<TakeoffMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void takeoffService.listAll().then((m) => {
      setMeasurements(m);
      setLoading(false);
    });
  }, [projects.length]);

  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.project.id, p.project.name]));
    return (id: string) => map.get(id) ?? "";
  }, [projects]);

  const filtered = useMemo(() => {
    return measurements.filter((m) => {
      if (filter === "verified" && m.verificationStatus !== "verified") return false;
      if (filter === "needs_review" && m.verificationStatus === "verified") return false;
      if (query) {
        const term = query.toLowerCase();
        if (!`${m.label} ${projectName(m.projectId)}`.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [measurements, filter, query, projectName]);

  const busy = loading || projectsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-[28px] text-ink">{t("projects.takeoffs_page.title")}</h1>
        <p className="mt-0.5 max-w-xl text-[13px] text-ink-soft">{t("projects.takeoffs_page.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-line-strong">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("projects.takeoffs_page.search_placeholder")}
            className="w-60 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div className="flex flex-nowrap gap-1.5">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            {t("projects.takeoffs_page.filter_all")}
          </Chip>
          <Chip active={filter === "needs_review"} onClick={() => setFilter("needs_review")}>
            {t("projects.takeoffs_page.filter_needs_review")}
          </Chip>
          <Chip active={filter === "verified"} onClick={() => setFilter("verified")}>
            {t("projects.takeoffs_page.filter_verified")}
          </Chip>
        </div>
        <span className="ml-auto text-[13px] text-muted">{t("projects.takeoffs_page.count", { n: String(filtered.length) })}</span>
      </div>

      {busy ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Ruler className="h-5 w-5" />}
          title={t("projects.takeoffs_page.empty_title")}
          description={t("projects.takeoffs_page.empty_description")}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("projects.takeoffs_page.table.measurement")}</TH>
              <TH>{t("projects.takeoffs_page.table.project")}</TH>
              <TH>{t("projects.takeoffs_page.table.trade")}</TH>
              <TH align="right">{t("projects.takeoffs_page.table.quantity")}</TH>
              <TH>{t("projects.takeoffs_page.table.source")}</TH>
              <TH>{t("projects.takeoffs_page.table.status")}</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((m) => {
              const Icon = STATUS_ICON[m.verificationStatus];
              return (
                <TR key={m.id} onClick={() => router.push(`/projects/${m.projectId}/takeoff`)}>
                  <TD className="font-medium">{m.label}</TD>
                  <TD className="text-ink-soft">{projectName(m.projectId)}</TD>
                  <TD>
                    <Badge tone="slate">{t(SCOPE_CATEGORY_KEY[m.category])}</Badge>
                  </TD>
                  <TD align="right">
                    {formatNumber(m.quantity, 2, locale)}{" "}
                    <span className="text-[11px] text-muted">{t(UNIT_KEYS[m.unit])}</span>
                  </TD>
                  <TD className="text-ink-soft">{t(`projects.takeoff.source.${m.source}`)}</TD>
                  <TD>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_TONE[m.verificationStatus] === "ok" && "bg-ok-bg text-ok",
                        STATUS_TONE[m.verificationStatus] === "warn" && "bg-warn-bg text-warn",
                        STATUS_TONE[m.verificationStatus] === "slate" && "bg-slate-bg text-slate",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {t(`projects.takeoff.status.${m.verificationStatus}`)}
                    </span>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-accent bg-accent-tint text-accent" : "border-line-strong text-ink-soft hover:border-ink/25 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
