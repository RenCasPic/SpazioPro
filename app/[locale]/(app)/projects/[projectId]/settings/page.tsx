"use client";

import { use, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ProjectShell } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ChangeLocationDialog } from "@/components/projects/change-location-dialog";
import { useEditor } from "@/hooks/use-editor";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useT } from "@/components/localization/i18n-provider";
import { projectService } from "@/lib/services/project-service";
import { clientService } from "@/lib/services/client-service";
import { PROJECT_STATUS_ORDER, PROJECT_TYPES, type Client, type ProjectStatus, type ProjectType } from "@/types";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import type { ProjectBundle } from "@/lib/services/project-service";

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { bundle, load } = useEditor();

  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  return (
    <ProjectShell projectId={projectId}>{(b, reload) => <Settings bundle={bundle ?? b} reload={reload} />}</ProjectShell>
  );
}

function Settings({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const t = useT();
  const router = useLocaleRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [form, setForm] = useState({
    name: bundle.project.name,
    description: bundle.project.description,
    clientId: bundle.project.clientId ?? "",
    projectType: bundle.project.projectType,
    status: bundle.project.status,
    estimateLanguage: bundle.project.estimateLanguage,
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
      estimateLanguage: form.estimateLanguage,
    });
    await reload();
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-serif text-2xl text-ink">{t("projects.settings.title")}</h2>

      <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <Field label={t("projects.new.name")}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t("projects.new.description")}>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("projects.new.client")}>
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">{t("projects.new.no_client")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("projects.new.type")}>
            <Select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value as ProjectType })}>
              {PROJECT_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(`common.project_type.${ty}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("projects.settings.status")}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              {PROJECT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(`common.project_status.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("projects.new.estimate_language")} hint={t("projects.settings.estimate_language_note")}>
            <Select value={form.estimateLanguage} onChange={(e) => setForm({ ...form, estimateLanguage: e.target.value as (typeof LOCALES)[number] })}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button onClick={save}>{t("common.actions.save_changes")}</Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h3 className="font-serif text-lg text-ink">{t("projects.settings.location_title")}</h3>
        <p className="text-sm text-ink-soft">
          {bundle.location ? `${bundle.location.address ? bundle.location.address + ", " : ""}${bundle.location.city}, ${bundle.location.stateCode} ${bundle.location.zipCode}` : "—"}
        </p>
        <p className="text-xs text-muted">{t("projects.settings.location_note")}</p>
        <Button variant="outline" size="sm" onClick={() => setLocationOpen(true)}>
          {t("editor.change_location")}
        </Button>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <h3 className="font-serif text-lg text-red-700">{t("projects.overview.danger_zone")}</h3>
        <p className="mt-1 text-sm text-red-700/80">{t("projects.overview.delete_warning")}</p>
        <Button
          variant="danger"
          size="sm"
          className="mt-3"
          onClick={async () => {
            if (confirm(t("projects.overview.delete_confirm", { name: bundle.project.name }))) {
              await projectService.remove(bundle.project.id);
              router.push("/projects");
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> {t("projects.overview.delete_project")}
        </Button>
      </div>

      <ChangeLocationDialog open={locationOpen} onClose={() => setLocationOpen(false)} bundle={bundle} />
    </div>
  );
}
