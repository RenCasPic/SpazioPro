"use client";

import { ArrowRight, Camera, ScanSearch, Layers, PackageSearch, Calculator, FileCheck2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LocaleLink } from "@/components/localization/locale-link";
import { LanguageSwitcher } from "@/components/localization/language-switcher";
import { useT, useLocale } from "@/components/localization/i18n-provider";

const FLOW = [
  { icon: Camera, key: "photo", tone: "#efe9df" },
  { icon: ScanSearch, key: "analysis", tone: "#e7dedd" },
  { icon: Layers, key: "design", tone: "#e4ddcf" },
  { icon: PackageSearch, key: "materials", tone: "#e9e2d6" },
  { icon: Calculator, key: "estimate", tone: "#efe6da" },
  { icon: FileCheck2, key: "build", tone: "#e6ece6" },
];

const FLOW_LABELS: Record<string, [string, string]> = {
  photo: ["Photo", "Fotografía"],
  analysis: ["AI Analysis", "Análisis IA"],
  design: ["Design", "Diseño"],
  materials: ["Materials", "Materiales"],
  estimate: ["Estimate", "Estimado"],
  build: ["Build", "Construir"],
};

export default function LandingPage() {
  const t = useT();
  const locale = useLocale();
  const li = locale === "es-US" ? 1 : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-paper">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <LocaleLink href="/login" className="rounded-full px-3 py-1.5 text-sm text-ink-soft hover:text-ink">
            {t("onboarding.auth.sign_in")}
          </LocaleLink>
          <LocaleLink href="/register" className="rounded-full bg-clay px-3.5 py-1.5 text-sm font-medium text-white hover:bg-clay-dark">
            {t("onboarding.auth.create_account")}
          </LocaleLink>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-20">
        <div className="animate-in max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            Built for US remodeling & construction · Demo mode on
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.03] tracking-tight text-ink sm:text-7xl">
            {t("common.app.tagline")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">{t("common.app.description")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LocaleLink
              href="/projects/new"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-clay px-6 text-[15px] font-medium text-white hover:bg-clay-dark"
            >
              {t("common.actions.create_project")}
              <ArrowRight className="h-4 w-4" />
            </LocaleLink>
            <LocaleLink
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-[15px] font-medium text-ink hover:border-ink/30"
            >
              See how it works
            </LocaleLink>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FLOW.map((step, i) => (
            <div
              key={step.key}
              className="animate-in relative overflow-hidden rounded-2xl border border-line p-5"
              style={{ background: step.tone, animationDelay: `${i * 60}ms` }}
            >
              <step.icon className="h-5 w-5 text-ink" />
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Step {i + 1}</p>
              <p className="font-serif text-lg text-ink">{FLOW_LABELS[step.key][li]}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-3 sm:p-10">
          <Feature title="US market, out of the box" text="USD pricing, imperial units, US labor rates, and sales tax resolved from the project's state, city and ZIP." />
          <Feature title="Reproducible estimates" text="Every estimate freezes a market snapshot — it won't change because a price or tax rate moves tomorrow." />
          <Feature title="Fully bilingual" text="Use the app in English or Español, and generate the estimate PDF in either language independently." />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:px-6">
          <Logo href={null} size="sm" />
          <p className="mt-1 max-w-2xl">{t("common.disclaimer")}</p>
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
