"use client";

import { use, useMemo, useState } from "react";
import { Layers3, Plus, Trash2, X } from "lucide-react";
import type { LaborCategory, ScopeSection } from "@/types";
import { ProjectShell } from "@/components/projects/project-shell";
import type { ProjectBundle } from "@/lib/services/project-service";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { scopeService } from "@/lib/services/scope-service";
import { itemBreakdown } from "@/lib/calculations/estimate";
import { computeScopeRollup } from "@/lib/calculations/scopes";
import { SCOPE_CATEGORIES, SCOPE_CATEGORY_KEY } from "@/data/scopes";
import { formatUsd0 } from "@/lib/format";

export default function ScopePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return (
    <ProjectShell projectId={projectId}>
      {(bundle, reload) => <Scope bundle={bundle} reload={reload} />}
    </ProjectShell>
  );
}

function Scope({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const t = useT();
  const locale = useLocale();
  const push = useToasts((s) => s.push);
  const [adding, setAdding] = useState(false);

  const room = bundle.rooms[0];
  const dims = room ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn } : { widthIn: 144, lengthIn: 180, heightIn: 108 };
  const activeItems = bundle.items.filter((i) => i.scenarioId === bundle.project.activeScenarioId);
  const breakdown = useMemo(
    () => activeItems.map((it) => itemBreakdown(it, dims, bundle.roomModel?.entities, bundle.takeoffMeasurements)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeItems, bundle.roomModel, bundle.takeoffMeasurements],
  );

  async function remove(id: string) {
    await scopeService.remove(id);
    push(t("projects.scope.removed"), "success");
    await reload();
  }
  async function save(id: string, patch: Partial<Pick<ScopeSection, "markupPercent" | "contingencyPercent">>) {
    await scopeService.update(id, patch);
    await reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[22px] text-ink">{t("projects.scope.title")}</h2>
          <p className="mt-1 max-w-xl text-[13px] text-ink-soft">{t("projects.scope.subtitle")}</p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> {t("projects.scope.add")}
          </Button>
        )}
      </div>

      {adding && (
        <AddScope
          projectId={bundle.project.id}
          scenarioId={bundle.project.activeScenarioId}
          onClose={() => setAdding(false)}
          onAdded={async () => {
            setAdding(false);
            await reload();
          }}
        />
      )}

      {bundle.scopeSections.length === 0 && !adding ? (
        <EmptyState
          icon={<Layers3 className="h-5 w-5" />}
          title={t("projects.scope.empty_title")}
          description={t("projects.scope.empty_description")}
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> {t("projects.scope.add")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bundle.scopeSections.map((s) => {
            const rollup = computeScopeRollup(s, breakdown, bundle.config.laborLines);
            return (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {t(SCOPE_CATEGORY_KEY[s.category])} · {t("projects.scope.items_count", { n: String(rollup.itemCount) })}
                    </p>
                  </div>
                  <button onClick={() => remove(s.id)} className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Field label={t("projects.scope.contingency")}>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={s.contingencyPercent}
                      key={`${s.id}-cont-${s.contingencyPercent}`}
                      onBlur={(e) => save(s.id, { contingencyPercent: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label={t("projects.scope.markup")}>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={s.markupPercent}
                      key={`${s.id}-markup-${s.markupPercent}`}
                      onBlur={(e) => save(s.id, { markupPercent: Number(e.target.value) || 0 })}
                    />
                  </Field>
                </div>

                <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[13px]">
                  <Row label={t("projects.scope.direct_cost")} value={formatUsd0(rollup.directCost, locale)} />
                  {rollup.contingency > 0 && <Row label={t("projects.scope.contingency_amount")} value={formatUsd0(rollup.contingency, locale)} />}
                  {rollup.markup > 0 && <Row label={t("projects.scope.markup_amount")} value={formatUsd0(rollup.markup, locale)} />}
                  <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
                    <dt>{t("projects.scope.selling_price")}</dt>
                    <dd className="tabular-nums">{formatUsd0(rollup.sellingPrice, locale)}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function AddScope({
  projectId,
  scenarioId,
  onClose,
  onAdded,
}: {
  projectId: string;
  scenarioId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LaborCategory>("flooring_installation");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await scopeService.add({ projectId, scenarioId, category, name: name.trim() });
    setBusy(false);
    onAdded();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{t("projects.scope.add")}</p>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-muted hover:bg-canvas">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={t("projects.scope.name")}>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("projects.scope.name_placeholder")} />
        </Field>
        <Field label={t("projects.scope.category")}>
          <Select value={category} onChange={(e) => setCategory(e.target.value as LaborCategory)}>
            {SCOPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(SCOPE_CATEGORY_KEY[c])}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.actions.cancel")}
        </Button>
        <Button type="submit" disabled={busy}>
          {t("common.actions.add")}
        </Button>
      </div>
    </form>
  );
}
