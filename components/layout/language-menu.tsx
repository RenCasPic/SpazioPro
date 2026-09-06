"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { LOCALES, LOCALE_SHORT, LOCALE_LABELS } from "@/lib/i18n/config";
import { useLocale } from "@/components/localization/i18n-provider";
import { useLocaleSwitcher } from "@/components/localization/locale-link";
import { cn } from "@/lib/utils";

export function LanguageMenu() {
  const locale = useLocale();
  const switchTo = useLocaleSwitcher();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
      >
        {LOCALE_SHORT[locale]}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {LOCALES.map((l) => (
            <button
              key={l}
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                if (l !== locale) switchTo(l);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-canvas"
            >
              {LOCALE_LABELS[l]}
              {l === locale && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
