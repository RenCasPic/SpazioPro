"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/components/localization/i18n-provider";
import { LocaleLink, useLocaleRouter } from "@/components/localization/locale-link";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AccountMenu({ compact = true }: { compact?: boolean }) {
  const t = useT();
  const { profile } = useSession();
  const router = useLocaleRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (profile?.fullName || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full transition-colors",
          compact ? "p-0.5 hover:bg-ink/[0.05]" : "w-full px-2 py-1.5 hover:bg-ink/[0.04]",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
          {initials}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">{profile?.fullName || "—"}</span>
              <span className="block truncate text-[11px] text-muted">
                {profile ? t(`common.professional_type.${profile.professionalType}`) : ""}
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]",
            compact ? "right-0" : "bottom-full left-0 mb-1.5 mt-0",
          )}
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-medium text-ink">{profile?.fullName}</p>
            <p className="truncate text-[11px] text-muted">{profile?.companyName || profile?.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <LocaleLink
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-canvas hover:text-ink"
          >
            <Settings className="h-4 w-4" /> {t("common.nav.settings")}
          </LocaleLink>
          {isDemoMode() && (
            <button
              onMouseDown={async (e) => {
                e.preventDefault();
                await demoAuth.signOut();
                router.replace("/login");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-canvas hover:text-ink"
            >
              <LogOut className="h-4 w-4" /> {t("settings.account.sign_out")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
