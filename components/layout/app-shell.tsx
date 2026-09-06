"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  LibraryBig,
  Users,
  ReceiptText,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { LanguageMenu } from "@/components/layout/language-menu";
import { Notifications } from "@/components/layout/notifications";
import { AccountMenu } from "@/components/layout/account-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { useSession } from "@/hooks/use-session";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/clients", key: "clients", icon: Users },
  { href: "/catalog", key: "catalog", icon: LibraryBig },
  { href: "/estimates", key: "estimates", icon: ReceiptText },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const active = (href: string) => {
    const full = `/${locale}${href}`;
    return href === "/dashboard" ? pathname === full : pathname.startsWith(full);
  };
  return (
    <nav className="space-y-0.5">
      {NAV.map((item) => (
        <LocaleLink
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
            active(item.href)
              ? "bg-accent-tint text-accent"
              : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
          )}
        >
          {active(item.href) && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
          <item.icon className="h-[17px] w-[17px]" strokeWidth={active(item.href) ? 2.2 : 1.8} />
          {t(`common.nav.${item.key}`)}
        </LocaleLink>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useLocaleRouter();
  const { profile, loading } = useSession();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!isDemoMode() || loading) return;
    if (!demoAuth.currentSession()) router.replace("/login");
    else if (profile && !profile.onboardingComplete) router.replace("/onboarding");
  }, [loading, profile, router]);

  useEffect(() => setDrawer(false), [pathname]);

  const active = (href: string) => {
    const full = `/${locale}${href}`;
    return href === "/dashboard" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pb-2 pt-5">
          <Logo href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <NavList />
          <div className="my-3 h-px bg-line" />
          <LocaleLink
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
              active("/settings") ? "bg-accent-tint text-accent" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
            )}
          >
            <Settings className="h-[17px] w-[17px]" strokeWidth={1.8} />
            {t("common.nav.settings")}
          </LocaleLink>
        </div>
        <div className="border-t border-line p-2">
          <AccountMenu compact={false} />
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        {/* header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setDrawer(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/[0.05] lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>

          <GlobalSearch className="ml-auto hidden w-full max-w-md sm:block lg:ml-0" />

          <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0 lg:pl-2">
            <LanguageMenu />
            <Notifications />
            <AccountMenu compact />
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={() => setDrawer(false)} />
          <div className="animate-in absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo href="/dashboard" size="sm" />
              <button onClick={() => setDrawer(false)} className="rounded-full p-1.5 text-muted hover:bg-canvas">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <GlobalSearch />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavList onNavigate={() => setDrawer(false)} />
              <div className="my-3 h-px bg-line" />
              <LocaleLink
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
              >
                <Settings className="h-[17px] w-[17px]" strokeWidth={1.8} />
                {t("common.nav.settings")}
              </LocaleLink>
            </div>
            <div className="border-t border-line p-3">
              <div className="flex items-center gap-2.5 px-1 py-1">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
                  {(profile?.fullName || "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{profile?.fullName}</p>
                  <p className="truncate text-[11px] text-muted">{profile?.companyName}</p>
                </div>
                {isDemoMode() && (
                  <button
                    onClick={async () => {
                      await demoAuth.signOut();
                      router.replace("/login");
                    }}
                    className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2">
                <LanguageMenu />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
