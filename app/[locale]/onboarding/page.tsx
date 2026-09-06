"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { StateSelect } from "@/components/countries/state-select";
import { useLocaleRouter, useLocaleSwitcher } from "@/components/localization/locale-link";
import { useT } from "@/components/localization/i18n-provider";
import { onboardingSchema } from "@/lib/validations/profile";
import { PROFESSIONAL_TYPES } from "@/types";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { profileService } from "@/lib/services/profile-service";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const t = useT();
  const router = useLocaleRouter();
  const switchLocale = useLocaleSwitcher();
  const [ready, setReady] = useState(false);

  const { register, handleSubmit, control, formState } = useForm<FormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { defaultStateCode: "TX", professionalType: "general_contractor", appLanguage: "en-US" },
  });

  useEffect(() => {
    (async () => {
      if (isDemoMode() && !demoAuth.currentSession()) {
        router.replace("/login");
        return;
      }
      const profile = await profileService.get();
      if (profile.onboardingComplete) router.replace("/dashboard");
      else setReady(true);
    })();
  }, [router]);

  async function onSubmit(values: FormValues) {
    await profileService.completeOnboarding({
      ...values,
      defaultZip: values.defaultZip ?? "",
      estimateLanguage: values.appLanguage,
    });
    if (values.appLanguage !== "en-US") switchLocale(values.appLanguage);
    else router.replace("/dashboard");
  }

  if (!ready) return <div className="grid min-h-screen place-items-center bg-paper text-sm text-muted">{t("common.states.loading")}</div>;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-paper px-4 py-12 sm:py-20">
      <Logo href={null} />
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-clay-dark">
        <Sparkles className="h-4 w-4" /> {t("onboarding.welcome")}
      </div>
      <h1 className="mt-2 display text-[28px] text-ink">{t("onboarding.title")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t("onboarding.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("onboarding.full_name")}>
            <Input autoFocus {...register("fullName")} />
            {formState.errors.fullName && <p className="mt-1 text-xs text-red-600">{formState.errors.fullName.message}</p>}
          </Field>
          <Field label={t("onboarding.company")}>
            <Input {...register("companyName")} />
          </Field>
        </div>

        <Field label={t("onboarding.what_you_do")}>
          <Select {...register("professionalType")}>
            {PROFESSIONAL_TYPES.map((p) => (
              <option key={p} value={p}>
                {t(`common.professional_type.${p}`)}
              </option>
            ))}
          </Select>
        </Field>

        <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted">{t("onboarding.where_you_work")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("onboarding.state")}>
            <Controller
              control={control}
              name="defaultStateCode"
              render={({ field }) => <StateSelect value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label={t("onboarding.city")}>
            <Input {...register("city")} />
          </Field>
          <Field label={t("onboarding.zip")}>
            <Input inputMode="numeric" maxLength={5} {...register("defaultZip")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("onboarding.phone")}>
            <Input type="tel" {...register("phone")} />
          </Field>
          <Field label={t("onboarding.preferred_language")}>
            <Select {...register("appLanguage")}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {t("onboarding.finish")}
        </Button>
      </form>
    </div>
  );
}
