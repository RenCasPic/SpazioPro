import { ArrowRight, Camera, ScanSearch, Layers, PackageSearch, Calculator, FileCheck2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/constants";

const FLOW = [
  { icon: Camera, label: "Fotografía", tone: "#efe9df" },
  { icon: ScanSearch, label: "Análisis", tone: "#e7dedd" },
  { icon: Layers, label: "Diseño", tone: "#e4ddcf" },
  { icon: PackageSearch, label: "Materiales", tone: "#e9e2d6" },
  { icon: Calculator, label: "Presupuesto", tone: "#efe6da" },
  { icon: FileCheck2, label: "Resultado", tone: "#e6ece6" },
];

export default function LandingPage() {
  return (
    <main className="min-h-full overflow-hidden">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-1">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Crear cuenta
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-20">
        <div className="animate-in max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            Para arquitectos, interioristas y empresas de reforma · Modo demo activo
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.03] tracking-tight text-ink sm:text-7xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Diseña espacios, visualiza propuestas y genera presupuestos profesionales
            —con precios, impuestos y mano de obra de tu mercado— desde un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/projects/new" size="lg">
              Crear proyecto
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="outline" size="lg">
              Ver cómo funciona
            </ButtonLink>
          </div>
        </div>

        {/* flow strip */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FLOW.map((step, i) => (
            <div
              key={step.label}
              className="animate-in relative overflow-hidden rounded-2xl border border-line p-5"
              style={{ background: step.tone, animationDelay: `${i * 60}ms` }}
            >
              <step.icon className="h-5 w-5 text-ink" />
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                Paso {i + 1}
              </p>
              <p className="font-serif text-lg text-ink">{step.label}</p>
              {i < FLOW.length - 1 && (
                <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink/20 lg:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-3 sm:p-10">
          <Feature
            title="Multi-país de serie"
            text="15 mercados con su moneda, impuestos, catálogo, mano de obra y transporte. El país del proyecto lo decide todo."
          />
          <Feature
            title="Presupuestos reproducibles"
            text="Cada presupuesto guarda un snapshot del mercado: no cambia porque suba un precio o un impuesto mañana."
          />
          <Feature
            title="Editor visual"
            text="Aplica materiales sobre la foto, coloca mobiliario respetando la escena y compara escenarios económico, estándar y premium."
          />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:px-6">
          <Logo href={null} size="sm" />
          <p className="mt-1 max-w-2xl">
            Esta herramienta genera estimaciones orientativas. Los precios y cantidades pueden variar
            según mediciones reales, condiciones del espacio, disponibilidad de materiales, proveedor,
            ubicación y mano de obra.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-serif text-lg text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{text}</p>
    </div>
  );
}
