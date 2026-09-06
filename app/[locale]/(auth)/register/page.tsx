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
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof credentialsSchema>;

export default function RegisterPage() {
  const t = useT();
  const router = useLocaleRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(credentialsSchema),
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      if (isDemoMode()) {
        await demoAuth.signUp(values.email, values.password);
        router.replace("/onboarding");
      } else {
        setError("Supabase sign-up requires environment configuration.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-up failed.");
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">{t("onboarding.auth.create_account")}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t("onboarding.auth.create_subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <Field label={t("onboarding.auth.email")}>
          <Input type="email" autoComplete="email" {...register("email")} />
          {formState.errors.email && <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>}
        </Field>
        <Field label={t("onboarding.auth.password")}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
          {formState.errors.password && <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>}
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t("onboarding.auth.creating") : t("onboarding.auth.create_account")}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        {t("onboarding.auth.have_account")}{" "}
        <LocaleLink href="/login" className="font-medium text-clay hover:text-clay-dark">
          {t("onboarding.auth.sign_in")}
        </LocaleLink>
      </p>
    </div>
  );
}
