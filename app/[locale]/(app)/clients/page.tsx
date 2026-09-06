"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, CLIENT_DEFAULTS, type ClientInput } from "@/lib/validations/client";
import { clientService } from "@/lib/services/client-service";
import { projectService } from "@/lib/services/project-service";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useT } from "@/components/localization/i18n-provider";
import type { Client } from "@/types";

export default function ClientsPage() {
  const t = useT();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    const [list, projects] = await Promise.all([clientService.list(query), projectService.list()]);
    setClients(list);
    setCounts(
      projects.reduce<Record<string, number>>((acc, p) => {
        if (p.project.clientId) acc[p.project.clientId] = (acc[p.project.clientId] ?? 0) + 1;
        return acc;
      }, {}),
    );
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[28px] text-ink">{t("common.nav.clients")}</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> {t("common.actions.add")}
        </Button>
      </div>

      <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-line-strong bg-surface px-3">
        <Search className="h-4 w-4 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.actions.search")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState icon={<Plus className="h-5 w-5" />} title={t("common.states.empty")} action={<Button onClick={() => setEditing("new")}>{t("common.actions.add")}</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg text-ink">{c.name}</h3>
                  {c.company && <p className="text-xs text-muted">{c.company}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`${t("common.actions.delete")}: ${c.name}?`)) {
                        await clientService.remove(c.id);
                        await refresh();
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-ink-soft">
                {c.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </p>
                )}
                {c.city && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {c.city}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-muted">{counts[c.id] ?? 0} {t("common.nav.projects").toLowerCase()}</p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ClientDialog
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ClientDialog({ client, onClose, onSaved }: { client: Client | null; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const { register, handleSubmit, formState } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          address: client.address,
          city: client.city,
          postalCode: client.postalCode,
          notes: client.notes,
        }
      : CLIENT_DEFAULTS,
  });

  async function onSubmit(values: ClientInput) {
    if (client) await clientService.update(client.id, values);
    else await clientService.create(values);
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} title={client ? t("common.actions.edit") : t("common.actions.add")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field label="Name">
          <Input autoFocus {...register("name")} />
          {formState.errors.name && <p className="mt-1 text-xs text-red-600">{formState.errors.name.message}</p>}
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Phone">
            <Input type="tel" {...register("phone")} />
          </Field>
        </div>
        <Field label="Company">
          <Input {...register("company")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City">
            <Input {...register("city")} />
          </Field>
          <Field label="ZIP">
            <Input {...register("postalCode")} />
          </Field>
        </div>
        <Field label="Address">
          <Input {...register("address")} />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} {...register("notes")} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.actions.cancel")}
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {t("common.actions.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
