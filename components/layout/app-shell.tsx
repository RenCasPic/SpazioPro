"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  LibraryBig,
  Users,
  ReceiptText,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { LanguageSwitcher } from "@/components/localization/language-switcher";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useSession } from "@/hooks/use-session";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/catalog", key: "catalog", icon: LibraryBig },
  { href: "/clients", key: "clients", icon: Users },
  { href: "/estimates", key: "estimates", icon: ReceiptText },
  { href: "/settings", key: "settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useLocaleRouter();
  const { profile, loading } = useSession();

  useEffect(() => {
    if (!isDemoMode() || loading) return;
    if (!demoAuth.currentSession()) router.replace("/login");
    else if (profile && !profile.onboardingComplete) router.replace("/onboarding");
  }, [loading, profile, router]);

  const active = (href: string) => {
    const full = `/${locale}${href}`;
    return href === "/dashboard" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Logo href="/dashboard" />
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active(item.href) ? "bg-clay-tint text-clay-dark" : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {t(`common.nav.${item.key}`)}
            </LocaleLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line p-3">
          <LanguageSwitcher />
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
              {(profile?.fullName || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{profile?.fullName || "—"}</p>
              <p className="truncate text-[11px] text-muted">{profile?.companyName || profile?.email}</p>
            </div>
            {isDemoMode() && (
              <button
                onClick={async () => {
                  await demoAuth.signOut();
                  router.replace("/login");
                }}
                title={t("settings.account.sign_out")}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-sm text-muted">{profile?.companyName || "SpazioPro"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
            <LocaleLink
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-clay px-3.5 text-sm font-medium text-white hover:bg-clay-dark"
            >
              <Plus className="h-4 w-4" />
              {t("common.actions.new_project")}
            </LocaleLink>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>

        <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface lg:hidden">
          {NAV.slice(0, 5).map((item) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                active(item.href) ? "text-clay" : "text-muted",
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`common.nav.${item.key}`)}
            </LocaleLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
