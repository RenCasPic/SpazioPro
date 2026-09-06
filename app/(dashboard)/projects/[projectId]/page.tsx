"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, ImageIcon, ReceiptText, Layers, Trash2 } from "lucide-react";
import { ProjectShell } from "@/components/projects/project-shell";
import { ButtonLink, Button } from "@/components/ui/button";
import { PriceDisclaimer } from "@/components/ui/disclaimer";
import { ConfidencePill } from "@/components/budget/confidence-pill";
import { useRouter } from "next/navigation";
import { estimateService } from "@/lib/services/estimate-service";
import { projectService } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { currencyService } from "@/lib/market/currency-service";
import { SCENARIO_LABELS, type Client } from "@/types";
import { formatDate } from "@/lib/format";
import type { LiveEstimate } from "@/lib/services/estimate-service";

export default function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();

  return (
    <ProjectShell projectId={projectId}>
      {(bundle) => <Overview bundle={bundle} onDeleted={() => router.push("/projects")} />}
    </ProjectShell>
  );
}

function Overview({
  bundle,
  onDeleted,
}: {
  bundle: import("@/lib/services/project-service").ProjectBundle;
  onDeleted: () => void;
}) {
  const { project, rooms, images, scenarios } = bundle;
  const room = rooms[0];
  const original = images.find((i) => i.type === "original");
  const [live, setLive] = useState<LiveEstimate | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    void estimateService.computeLive(project.id).then(setLive);
    if (project.clientId) void clientService.get(project.clientId).then(setClient);
  }, [project.id, project.clientId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {original ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={original.originalUrl}
              alt={project.name}
              className="aspect-[16/10] w-full object-cover"
              style={original.designFilter ? { filter: original.designFilter } : undefined}
            />
          ) : (
            <div className="grid aspect-[16/10] place-items-center bg-paper text-sm text-muted">
              Sin fotografía todavía
            </div>
          )}
          <div className="flex flex-wrap gap-2 p-4">
            <ButtonLink href={`/projects/${project.id}/editor`} size="sm">
              <Pencil className="h-4 w-4" /> Abrir editor
            </ButtonLink>
            <ButtonLink href={`/projects/${project.id}/images`} variant="outline" size="sm">
              <ImageIcon className="h-4 w-4" /> Imágenes
            </ButtonLink>
            <ButtonLink href={`/projects/${project.id}/budget`} variant="outline" size="sm">
              <ReceiptText className="h-4 w-4" /> Presupuesto
            </ButtonLink>
            <ButtonLink href={`/projects/${project.id}/scenarios`} variant="outline" size="sm">
              <Layers className="h-4 w-4" /> Escenarios
            </ButtonLink>
          </div>
        </div>

        {project.description && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-serif text-lg text-ink">Descripción</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{project.description}</p>
          </div>
        )}

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-serif text-lg text-ink">Escenarios</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {scenarios.map((s) => (
              <Link
                key={s.id}
                href={`/projects/${project.id}/scenarios`}
                className="rounded-xl border border-line px-3 py-2.5 hover:border-ink/20"
              >
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-muted">{SCENARIO_LABELS[s.type]}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-serif text-lg text-ink">Presupuesto estimado</h3>
          {live ? (
            <>
              <p className="mt-1 font-serif text-3xl text-ink">
                {currencyService.format({ amount: live.totals.total, currency: live.totals.currency }, project.locale)}
              </p>
              <div className="mt-2">
                <ConfidencePill report={live.confidence} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label="Materiales" value={fmt(live.totals.materials, project)} />
                <Row label="Mano de obra" value={fmt(live.totals.labor, project)} />
                <Row label="Transporte" value={fmt(live.totals.transport, project)} />
                <Row label={`IVA ${project.taxRate}%`} value={fmt(live.totals.tax, project)} />
              </dl>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Calculando…</p>
          )}
          <ButtonLink href={`/projects/${project.id}/budget`} className="mt-4 w-full" size="sm">
            Ver presupuesto completo
          </ButtonLink>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
          <h3 className="font-serif text-lg text-ink">Detalles</h3>
          <dl className="mt-3 space-y-2">
            <Row label="Cliente" value={client?.name ?? "Sin cliente"} />
            <Row label="Mercado" value={project.countryCode} />
            <Row label="Moneda" value={project.currencyCode} />
            {room && (
              <Row
                label="Dimensiones"
                value={`${room.width} × ${room.length} × ${room.height} m`}
              />
            )}
            {room && <Row label="Superficie suelo" value={`${room.floorArea} m²`} />}
            <Row label="Creado" value={formatDate(project.createdAt)} />
          </dl>
        </div>

        <PriceDisclaimer />

        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={async () => {
            if (confirm(`¿Eliminar "${project.name}"? Esta acción no se puede deshacer.`)) {
              await projectService.remove(project.id);
              onDeleted();
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> Eliminar proyecto
        </Button>
      </div>
    </div>
  );
}

function fmt(n: number, project: { currencyCode: string; locale: string }) {
  return currencyService.format(
    { amount: n, currency: project.currencyCode as never },
    project.locale,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
