"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { profileService } from "@/lib/services/profile-service";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StateSelect } from "@/components/countries/state-select";
import { Spinner } from "@/components/ui/states";
import { useT } from "@/components/localization/i18n-provider";
import { useLocaleSwitcher } from "@/components/localization/locale-link";
import { PROFESSIONAL_TYPES, type Profile } from "@/types";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { isDemoMode } from "@/lib/constants";

export default function SettingsPage() {
  const t = useT();
  const switchLocale = useLocaleSwitcher();
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
    if (form!.appLanguage !== profile?.appLanguage) switchLocale(form!.appLanguage);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="display text-[28px] text-ink">{t("settings.title")}</h1>

      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-serif text-lg text-ink">{t("settings.profile.title")}</h2>
        <p className="text-xs text-muted">{t("settings.profile.note")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.profile.full_name")}>
            <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.company_name")}>
            <Input value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.email")}>
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.phone")}>
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.city")}>
            <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.address")}>
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.license")}>
            <Input value={form.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.website")}>
            <Input value={form.website} onChange={(e) => set({ website: e.target.value })} />
          </Field>
          <Field label={t("settings.profile.professional_type")}>
            <Select value={form.professionalType} onChange={(e) => set({ professionalType: e.target.value as Profile["professionalType"] })}>
              {PROFESSIONAL_TYPES.map((p) => (
                <option key={p} value={p}>
                  {t(`common.professional_type.${p}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t("settings.profile.terms")}>
          <Textarea rows={3} value={form.terms} onChange={(e) => set({ terms: e.target.value })} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-serif text-lg text-ink">{t("settings.preferences.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.preferences.app_language")}>
            <Select value={form.appLanguage} onChange={(e) => set({ appLanguage: e.target.value as (typeof LOCALES)[number] })}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("settings.preferences.estimate_language")}>
            <Select value={form.estimateLanguage} onChange={(e) => set({ estimateLanguage: e.target.value as (typeof LOCALES)[number] })}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("settings.preferences.default_state")}>
            <StateSelect value={form.defaultStateCode} onChange={(code) => set({ defaultStateCode: code })} />
          </Field>
          <Field label={t("settings.preferences.default_zip")}>
            <Input inputMode="numeric" maxLength={5} value={form.defaultZip} onChange={(e) => set({ defaultZip: e.target.value })} />
          </Field>
          <Field label={t("settings.preferences.measurement")}>
            <Select value={form.measurementSystem} onChange={(e) => set({ measurementSystem: e.target.value as Profile["measurementSystem"] })}>
              <option value="imperial">{t("settings.preferences.measurement_imperial")}</option>
              <option value="metric">{t("settings.preferences.measurement_metric")}</option>
            </Select>
          </Field>
        </div>
        <Button onClick={save}>
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? t("common.actions.saved") : t("common.actions.save_changes")}
        </Button>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
        <h2 className="font-serif text-lg text-ink">{t("settings.account.title")}</h2>
        <p className="mt-1">{isDemoMode() ? t("settings.account.demo") : t("settings.account.supabase")}</p>
      </section>
    </div>
  );
}
