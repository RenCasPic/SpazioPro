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
import { isDemoMode } from "@/lib/constants";

type FormValues = z.infer<typeof credentialsSchema>;

export default function RegisterPage() {
  const router = useRouter();
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
        setError("El registro con Supabase requiere configurar las variables de entorno.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Empieza a diseñar y presupuestar en minutos.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" {...register("email")} />
          {formState.errors.email && (
            <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>
          )}
        </Field>
        <Field label="Contraseña">
          <Input type="password" autoComplete="new-password" {...register("password")} />
          {formState.errors.password && (
            <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>
          )}
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-clay hover:text-clay-dark">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
