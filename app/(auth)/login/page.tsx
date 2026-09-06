"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { credentialsSchema } from "@/lib/validations/profile";
import { demoAuth } from "@/lib/auth/demo-auth";
import { profileService } from "@/lib/services/profile-service";
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof credentialsSchema>;

export default function LoginPage() {
  const router = useRouter();
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
        setError("El inicio de sesión con Supabase requiere configurar las variables de entorno.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Inicia sesión</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Bienvenido de nuevo. Cuenta demo prellenada.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Contraseña">
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-clay hover:text-clay-dark">
          Crear cuenta
        </Link>
      </p>
      <button
        onClick={() =>
          demoAuth.sendPasswordReset("demo@spaziopro.app").then((r) => setError(r.message))
        }
        className="mt-2 text-xs text-muted underline"
      >
        He olvidado mi contraseña
      </button>
    </div>
  );
}
