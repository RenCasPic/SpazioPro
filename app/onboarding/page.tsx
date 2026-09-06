"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { CountrySelect } from "@/components/countries/country-select";
import { onboardingSchema } from "@/lib/validations/profile";
import { PROFESSIONAL_TYPE_LABELS } from "@/types";
import { profileService } from "@/lib/services/profile-service";
import { countryService } from "@/lib/market/country-service";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const { register, handleSubmit, control, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { countryCode: "ES", professionalType: "interior_designer" },
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

  const country = countryService.get(watch("countryCode"));

  async function onSubmit(values: FormValues) {
    await profileService.completeOnboarding(values);
    router.replace("/dashboard");
  }

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted">Cargando…</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-20">
      <Logo href={null} />
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-clay-dark">
        <Sparkles className="h-4 w-4" /> Bienvenido/a a SpazioPro
      </div>
      <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink">
        Cuéntanos sobre ti
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Con estos datos configuramos tu mercado (moneda, impuestos, catálogo y tarifas) y
        rellenamos tus presupuestos.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Field label="Nombre y apellidos">
          <Input autoFocus {...register("fullName")} />
          {formState.errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{formState.errors.fullName.message}</p>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Empresa / estudio">
            <Input {...register("companyName")} />
          </Field>
          <Field label="Teléfono">
            <Input type="tel" {...register("phone")} />
          </Field>
        </div>
        <Field label="País / mercado" hint={country ? `Moneda: ${country.currencyCode} ${country.currencySymbol} · IVA por defecto ${country.defaultTaxRate}%` : undefined}>
          <Controller
            control={control}
            name="countryCode"
            render={({ field }) => <CountrySelect value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ciudad">
            <Input {...register("city")} />
          </Field>
          <Field label="Tipo de profesional">
            <Select {...register("professionalType")}>
              {Object.entries(PROFESSIONAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          Entrar a SpazioPro
        </Button>
      </form>
    </div>
  );
}
