"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { useT } from "@/components/localization/i18n-provider";
import { credentialsSchema } from "@/lib/validations/profile";
import { demoAuth } from "@/lib/auth/demo-auth";
import { profileService } from "@/lib/services/profile-service";
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof credentialsSchema>;

export default function LoginPage() {
  const t = useT();
  const router = useLocaleRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "demo@spaziopro.app", password: "demo" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      if (isDemoMode()) {
        await demoAuth.signIn(values.email, values.password);
        const profile = await profileService.get();
        router.replace(profile.onboardingComplete ? "/dashboard" : "/onboarding");
      } else {
        setError("Supabase sign-in requires environment configuration.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">{t("onboarding.auth.sign_in")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t("onboarding.auth.sign_in_subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <Field label={t("onboarding.auth.email")}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label={t("onboarding.auth.password")}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t("onboarding.auth.entering") : t("onboarding.auth.enter")}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        {t("onboarding.auth.no_account")}{" "}
        <LocaleLink href="/register" className="font-medium text-clay hover:text-clay-dark">
          {t("onboarding.auth.create_account")}
        </LocaleLink>
      </p>
      <button
        onClick={() => demoAuth.sendPasswordReset("demo@spaziopro.app").then((r) => setError(r.message))}
        className="mt-2 text-xs text-muted underline"
      >
        {t("onboarding.auth.forgot")}
      </button>
    </div>
  );
}
