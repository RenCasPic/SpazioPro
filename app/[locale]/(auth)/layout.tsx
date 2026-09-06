"use client";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/localization/language-switcher";
import { useT } from "@/components/localization/i18n-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between">
            <Logo href="/" />
            <LanguageSwitcher />
          </div>
          <div className="mt-10">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-90 [background:radial-gradient(circle_at_30%_20%,#3a2b22,transparent_55%),radial-gradient(circle_at_75%_75%,#2a3a2f,transparent_50%),#1c1917]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-serif text-4xl leading-tight">{t("common.app.tagline")}</p>
          <p className="mt-3 max-w-md text-sm text-white/70">{t("onboarding.auth.panel_text")}</p>
        </div>
      </div>
    </div>
  );
}
