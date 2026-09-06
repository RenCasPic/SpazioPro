"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ProjectShell } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CountrySelect } from "@/components/countries/country-select";
import { ChangeCountryDialog } from "@/components/projects/change-country-dialog";
import { useEditor } from "@/hooks/use-editor";
import { projectService } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_ORDER, PROJECT_TYPE_LABELS, type Client, type ProjectType, type ProjectStatus } from "@/types";
import type { ProjectBundle } from "@/lib/services/project-service";

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { bundle, load } = useEditor();

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  return (
    <ProjectShell projectId={projectId}>
      {(b, reload) => <Settings bundle={bundle ?? b} reload={reload} />}
    </ProjectShell>
  );
}

function Settings({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [form, setForm] = useState({
    name: bundle.project.name,
    description: bundle.project.description,
    clientId: bundle.project.clientId ?? "",
    projectType: bundle.project.projectType,
    status: bundle.project.status,
  });

  useEffect(() => {
    void clientService.list().then(setClients);
  }, []);

  async function save() {
    await projectService.update(bundle.project.id, {
      name: form.name,
      description: form.description,
      clientId: form.clientId || null,
      projectType: form.projectType,
      status: form.status,
    });
    await reload();
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-serif text-2xl text-ink">Configuración del proyecto</h2>

      <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Descripción">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de espacio">
            <Select
              value={form.projectType}
              onChange={(e) => setForm({ ...form, projectType: e.target.value as ProjectType })}
            >
              {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Estado">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
          >
            {PROJECT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={save}>Guardar cambios</Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h3 className="font-serif text-lg text-ink">País / mercado</h3>
        <p className="text-sm text-ink-soft">
          Mercado actual: <strong>{bundle.project.countryCode}</strong> · {bundle.project.currencyCode}
        </p>
        <CountrySelect value={bundle.project.countryCode} onChange={() => setCountryOpen(true)} />
        <p className="text-xs text-muted">
          Cambiar el país recalcula moneda, impuestos, precios y mano de obra. Los presupuestos ya
          generados conservan su snapshot y no cambian.
        </p>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <h3 className="font-serif text-lg text-red-700">Zona de peligro</h3>
        <p className="mt-1 text-sm text-red-700/80">Eliminar el proyecto borra sus habitaciones, imágenes, escenarios y presupuestos.</p>
        <Button
          variant="danger"
          size="sm"
          className="mt-3"
          onClick={async () => {
            if (confirm(`¿Eliminar "${bundle.project.name}"?`)) {
              await projectService.remove(bundle.project.id);
              router.push("/projects");
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> Eliminar proyecto
        </Button>
      </div>

      <ChangeCountryDialog open={countryOpen} onClose={() => setCountryOpen(false)} bundle={bundle} />
    </div>
  );
}
