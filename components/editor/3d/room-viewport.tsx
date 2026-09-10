"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Footprints, Loader2, Ruler, ScanSearch, TriangleAlert } from "lucide-react";
import { useEditor, activeItems } from "@/hooks/use-editor";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatArea } from "@/lib/format";
import { fromInches } from "@/lib/calculations/units";
import { entityNeedsReview, effectiveSurfaceConfidence } from "@/lib/spatial/reconstruction";
import { cn } from "@/lib/utils";

const RoomScene = dynamic(() => import("./room-scene").then((m) => m.RoomScene), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

export function RoomViewport() {
  const t = useT();
  const locale = useLocale();
  const { bundle, roomModel, selectedEntityId, selectEntity, calibrateRoomModel, editRoomModel, reconstructing } =
    useEditor();
  const [walk, setWalk] = useState(false);

  const items = useMemo(() => (bundle ? activeItems(bundle) : []), [bundle]);
  const selected = roomModel?.entities.find((e) => e.id === selectedEntityId) ?? null;
  const needsCalibration = roomModel && roomModel.calibration.status === "uncalibrated";
  const reviewCount = roomModel
    ? roomModel.entities.filter((e) => e.quantifiable && entityNeedsReview(e)).length
    : 0;

  if (!roomModel) {
    return <NoModel />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f4f5f6]">
      {reconstructing && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-surface/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-sm text-ink-soft">
            <ScanSearch className="h-6 w-6 animate-pulse text-accent" />
            {t("editor.d3.building")}
          </div>
        </div>
      )}

      <RoomScene
        model={roomModel}
        items={items}
        selectedEntityId={selectedEntityId}
        onSelectEntity={selectEntity}
        walkMode={walk}
      />

      {/* controls */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-1.5">
        <button
          onClick={() => setWalk((w) => !w)}
          className={cn(
            "pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium backdrop-blur",
            walk ? "border-accent bg-accent text-white" : "border-line bg-surface/90 text-ink-soft",
          )}
        >
          <Footprints className="h-4 w-4" />
          {t("editor.d3.walk")}
        </button>
      </div>

      {/* calibration prompt */}
      {needsCalibration && !selected && (
        <CalibrationCard
          onConfirm={(entityId, kind, valueIn) => calibrateRoomModel([{ entityId, kind, valueIn }])}
          model={roomModel}
        />
      )}

      {/* review banner */}
      {!needsCalibration && reviewCount > 0 && !selected && (
        <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-3 py-1.5 text-[12px] font-medium text-warn">
          <TriangleAlert className="h-3.5 w-3.5" />
          {t("editor.d3.review_count", { n: reviewCount })}
        </div>
      )}

      {/* selected surface card */}
      {selected && (
        <div className="absolute bottom-3 left-3 z-20 w-[260px] rounded-2xl border border-line bg-surface/95 p-3.5 shadow-[var(--shadow-raised)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t(`editor.d3.entity.${selected.type}`)}
          </p>
          <p className="mt-0.5 font-serif text-[15px] text-ink">{selected.label}</p>

          {selected.dimensions.grossAreaSqFt != null && (
            <dl className="mt-2 space-y-0.5 text-[12px]">
              <Row label={t("editor.d3.gross")} value={formatArea(selected.dimensions.grossAreaSqFt, "imperial", locale)} />
              {selected.dimensions.netAreaSqFt != null &&
                selected.dimensions.netAreaSqFt !== selected.dimensions.grossAreaSqFt && (
                  <Row label={t("editor.d3.net")} value={formatArea(selected.dimensions.netAreaSqFt, "imperial", locale)} />
                )}
              {selected.dimensions.lengthIn != null && (
                <Row label={t("editor.width")} value={ftIn(selected.dimensions.lengthIn)} />
              )}
            </dl>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                selected.calibrationStatus === "calibrated" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn",
              )}
            >
              {selected.calibrationStatus === "calibrated" ? t("editor.d3.calibrated") : t("editor.d3.uncalibrated")}
            </span>
            <span className="text-muted">
              {Math.round(effectiveSurfaceConfidence(selected) * 100)}%
            </span>
          </div>

          {entityNeedsReview(selected) && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2.5 w-full"
              onClick={() => editRoomModel({ op: "mark_reviewed", entityId: selected.id })}
            >
              <Check className="h-3.5 w-3.5" /> {t("editor.d3.mark_ok")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CalibrationCard({
  model,
  onConfirm,
}: {
  model: import("@/types").RoomModel;
  onConfirm: (entityId: string, kind: import("@/types").MeasurementKind, valueIn: number) => void;
}) {
  const t = useT();
  // pick the longest wall as the reference
  const wall = model.entities
    .filter((e) => e.type === "wall")
    .sort((a, b) => (b.dimensions.lengthIn ?? 0) - (a.dimensions.lengthIn ?? 0))[0];
  const guess = fromInches(wall?.dimensions.lengthIn ?? 120);
  const [ft, setFt] = useState(guess.feet);
  const [inches, setInches] = useState(guess.inches);
  const [busy, setBusy] = useState(false);

  if (!wall) return null;

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[320px] -translate-x-1/2 rounded-2xl border border-line bg-surface/95 p-4 shadow-[var(--shadow-pop)] backdrop-blur">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
        <Ruler className="h-4 w-4 text-accent" />
        {t("editor.d3.calibrate_title")}
      </p>
      <p className="mt-1 text-[12px] text-muted">{t("editor.d3.calibrate_hint", { wall: wall.label })}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <Input type="number" min={1} value={ft} onChange={(e) => setFt(Number(e.target.value))} className="text-center" />
        <span className="text-xs text-muted">{t("common.unit.ft")}</span>
        <Input type="number" min={0} max={11} value={inches} onChange={(e) => setInches(Number(e.target.value))} className="text-center" />
        <span className="text-xs text-muted">{t("common.unit.in")}</span>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full"
        disabled={busy || ft < 1}
        onClick={async () => {
          setBusy(true);
          onConfirm(wall.id, "wall_length", ft * 12 + inches);
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {t("editor.d3.calibrate_confirm")}
      </Button>
    </div>
  );
}

function NoModel() {
  const t = useT();
  const { bundle, runReconstruction, reconstructing } = useEditor();
  const image = bundle?.images.find((i) => i.type === "original");

  return (
    <div className="grid h-full place-items-center bg-[#f4f5f6] px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-tint text-accent">
          <ScanSearch className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-serif text-lg text-ink">{t("editor.d3.none_title")}</h3>
        <p className="mt-1 text-sm text-ink-soft">{t("editor.d3.none_hint")}</p>
        <Button
          className="mt-4"
          disabled={reconstructing || !image}
          onClick={() => runReconstruction(image ? [image.originalUrl] : [], bundle?.project.projectType)}
        >
          {reconstructing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
          {t("editor.d3.build_cta")}
        </Button>
      </div>
    </div>
  );
}

function SceneSkeleton() {
  return (
    <div className="grid h-full place-items-center bg-[#f4f5f6]">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function ftIn(totalIn: number): string {
  const { feet, inches } = fromInches(totalIn);
  return inches ? `${feet}′ ${inches}″` : `${feet}′`;
}
