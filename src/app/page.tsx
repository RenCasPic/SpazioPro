import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Camera, Layers, Calculator, FileText, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: Camera, title: "Fotografía tu espacio", text: "Sube o toma una foto de la habitación, local o terraza que quieres transformar." },
  { icon: Layers, title: "Diseña diferentes opciones", text: "Cambia suelos, pinturas y revestimientos y coloca mobiliario respetando la escena." },
  { icon: Calculator, title: "Calcula materiales", text: "Introduce las medidas y obtén cantidades con desperdicio y mano de obra." },
  { icon: FileText, title: "Obtén un presupuesto", text: "Compara escenarios económico, estándar y premium y expórtalo en PDF." },
];

export default function LandingPage() {
  return (
    <main className="min-h-full">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <ButtonLink href="/dashboard" variant="ghost" size="sm">
          Entrar
        </ButtonLink>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-20">
        <div className="animate-in max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            Interiorismo asistido por IA · Modo demo activo
          </span>
          <h1 className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Transforma cualquier espacio antes de empezar la obra.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            SpazioPro convierte una fotografía en un proyecto cuantificable: diseña
            opciones, mide superficies y genera un presupuesto profesional en minutos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/projects/new" size="lg">
              Crear mi primer proyecto
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="outline" size="lg">
              Ver mis proyectos
            </ButtonLink>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="animate-in rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-tint text-clay-dark">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Paso {i + 1}
              </p>
              <h3 className="mt-1 font-serif text-lg text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-xs text-muted sm:px-6">
          <Logo href={null} size="sm" />
          <p className="mt-2">
            Estimación orientativa. Los precios y cantidades pueden variar según proveedor,
            mediciones reales, condiciones del espacio y mano de obra.
          </p>
        </div>
      </footer>
    </main>
  );
}
