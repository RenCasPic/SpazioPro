"use client";

import { use, useState } from "react";
import { Plus, Ruler, ShieldCheck, ShieldAlert, Trash2, X } from "lucide-react";
import type { LaborCategory, TakeoffMeasurement, Unit } from "@/types";
import { ProjectShell } from "@/components/projects/project-shell";
import type { ProjectBundle } from "@/lib/services/project-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useT } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { takeoffService } from "@/lib/services/takeoff-service";
import { SCOPE_CATEGORIES, SCOPE_CATEGORY_KEY } from "@/data/scopes";
import { UNIT_KEYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { useLocale } from "@/components/localization/i18n-provider";
import { cn } from "@/lib/utils";

const UNITS: Unit[] = ["sq_ft", "linear_ft", "ea", "cu_ft", "cu_yd", "gallon", "hour", "day", "project"];

export default function TakeoffPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return (
    <ProjectShell projectId={projectId}>
      {(bundle, reload) => <Takeoff bundle={bundle} reload={reload} />}
    </ProjectShell>
  );
}

function Takeoff({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const t = useT();
  const locale = useLocale();
  const push = useToasts((s) => s.push);
  const [adding, setAdding] = useState(false);

  const measurements = bundle.takeoffMeasurements;

  async function verify(id: string) {
    await takeoffService.verify(id);
    await reload();
  }
  async function remove(id: string) {
    await takeoffService.remove(id);
    push(t("projects.takeoff.removed"), "success");
    await reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[22px] text-ink">{t("projects.takeoff.title")}</h2>
          <p className="mt-1 max-w-xl text-[13px] text-ink-soft">{t("projects.takeoff.subtitle")}</p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> {t("projects.takeoff.add")}
          </Button>
        )}
      </div>

      {adding && (
        <AddMeasurement
          projectId={bundle.project.id}
          roomId={bundle.rooms[0]?.id ?? null}
          onClose={() => setAdding(false)}
          onAdded={async () => {
            setAdding(false);
            await reload();
          }}
        />
      )}

      {measurements.length === 0 && !adding ? (
        <EmptyState
          icon={<Ruler className="h-5 w-5" />}
          title={t("projects.takeoff.empty_title")}
          description={t("projects.takeoff.empty_description")}
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> {t("projects.takeoff.add")}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {measurements.map((m) => (
            <Row key={m.id} m={m} locale={locale} onVerify={() => verify(m.id)} onRemove={() => remove(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  m,
  locale,
  onVerify,
  onRemove,
}: {
  m: TakeoffMeasurement;
  locale: "en-US" | "es-US";
  onVerify: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const verified = m.verificationStatus === "verified";
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{m.label}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <Badge tone="slate">{t(SCOPE_CATEGORY_KEY[m.category])}</Badge>
          <span>{t(`projects.takeoff.source.${m.source}`)}</span>
        </p>
      </div>
      <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
        {formatNumber(m.quantity, 2, locale)} <span className="text-[11px] font-normal text-muted">{t(UNIT_KEYS[m.unit])}</span>
      </p>
      <button
        onClick={!verified ? onVerify : undefined}
        title={verified ? t("projects.takeoff.verified") : t("projects.takeoff.verify")}
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
          verified ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn hover:opacity-80",
        )}
      >
        {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
        {verified ? t("projects.takeoff.verified") : t("projects.takeoff.verify")}
      </button>
      <button onClick={onRemove} className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddMeasurement({
  projectId,
  roomId,
  onClose,
  onAdded,
}: {
  projectId: string;
  roomId: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useT();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<LaborCategory>("flooring_installation");
  const [unit, setUnit] = useState<Unit>("sq_ft");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!label.trim() || !Number.isFinite(qty) || qty <= 0) return;
    setBusy(true);
    await takeoffService.add({ projectId, roomId, category, label: label.trim(), unit, quantity: qty });
    setBusy(false);
    onAdded();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{t("projects.takeoff.add")}</p>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-muted hover:bg-canvas">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
        <Field label={t("projects.takeoff.label")}>
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("projects.takeoff.label_placeholder")} />
        </Field>
        <Field label={t("projects.takeoff.category")}>
          <Select value={category} onChange={(e) => setCategory(e.target.value as LaborCategory)}>
            {SCOPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(SCOPE_CATEGORY_KEY[c])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("projects.takeoff.quantity")}>
          <Input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label={t("projects.takeoff.unit")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(UNIT_KEYS[u])}
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
