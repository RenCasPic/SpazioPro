"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { profileService } from "@/lib/services/profile-service";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CountrySelect } from "@/components/countries/country-select";
import { Spinner } from "@/components/ui/states";
import { PROFESSIONAL_TYPE_LABELS, type Profile } from "@/types";
import { isDemoMode } from "@/lib/constants";

export default function SettingsPage() {
  const { profile, refresh } = useSession();
  const [form, setForm] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (!form) return <div className="grid place-items-center py-20"><Spinner className="h-5 w-5" /></div>;

  const set = (patch: Partial<Profile>) => setForm({ ...form, ...patch });

  async function save() {
    await profileService.update(form!);
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl tracking-tight text-ink">Configuración</h1>

      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-serif text-lg text-ink">Perfil profesional</h2>
        <p className="text-xs text-muted">Estos datos se usan automáticamente en tus presupuestos y PDFs.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre y apellidos">
            <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
          </Field>
          <Field label="Empresa / estudio">
            <Input value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Ciudad">
            <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="Identificación fiscal">
            <Input value={form.taxId} onChange={(e) => set({ taxId: e.target.value })} />
          </Field>
          <Field label="Web">
            <Input value={form.website} onChange={(e) => set({ website: e.target.value })} />
          </Field>
          <Field label="Tipo de profesional">
            <Select value={form.professionalType} onChange={(e) => set({ professionalType: e.target.value as Profile["professionalType"] })}>
              {Object.entries(PROFESSIONAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Impuesto por defecto (%)">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.defaultTaxRate}
              onChange={(e) => set({ defaultTaxRate: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Field label="País / mercado">
          <CountrySelect value={form.countryCode} onChange={(code) => set({ countryCode: code })} />
        </Field>

        <Field label="Condiciones (aparecen en el PDF)">
          <Textarea rows={3} value={form.terms} onChange={(e) => set({ terms: e.target.value })} />
        </Field>

        <Button onClick={save}>
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? "Guardado" : "Guardar cambios"}
        </Button>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
        <h2 className="font-serif text-lg text-ink">Cuenta</h2>
        <p className="mt-1">
          {isDemoMode()
            ? "Estás en modo demo: los datos se guardan en este navegador. Para persistencia real configura Supabase (ver README)."
            : "Sesión conectada a Supabase."}
        </p>
      </section>
    </div>
  );
}
