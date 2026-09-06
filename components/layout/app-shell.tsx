"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { ButtonLink } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/catalog", label: "Catálogo", icon: LibraryBig },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/estimates", label: "Presupuestos", icon: ReceiptText },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useSession();

  useEffect(() => {
    if (!isDemoMode()) return;
    if (!loading && !demoAuth.currentSession()) router.replace("/login");
    else if (!loading && profile && !profile.onboardingComplete) router.replace("/onboarding");
  }, [loading, profile, router]);

  const active = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-paper">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Logo href="/dashboard" />
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active(item.href)
                  ? "bg-clay-tint text-clay-dark"
                  : "text-ink-soft hover:bg-paper hover:text-ink",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
              {(profile?.fullName || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {profile?.fullName || "Profesional"}
              </p>
              <p className="truncate text-[11px] text-muted">{profile?.companyName || profile?.email}</p>
            </div>
            {isDemoMode() && (
              <button
                onClick={async () => {
                  await demoAuth.signOut();
                  router.replace("/login");
                }}
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>
          <span className="hidden text-sm text-muted lg:block">
            {profile?.companyName || "SpazioPro"}
          </span>
          <ButtonLink href="/projects/new" size="sm">
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </ButtonLink>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>

        {/* bottom nav (mobile) */}
        <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface lg:hidden">
          {NAV.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                active(item.href) ? "text-clay" : "text-muted",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
