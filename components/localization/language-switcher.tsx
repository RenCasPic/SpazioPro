"use client";

import { LOCALES, LOCALE_SHORT } from "@/lib/i18n/config";
import { useLocale } from "./i18n-provider";
import { useLocaleSwitcher } from "./locale-link";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const switchTo = useLocaleSwitcher();

  return (
    <div className={cn("inline-flex items-center rounded-full border border-line-strong bg-surface p-0.5", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => l !== locale && switchTo(l)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            l === locale ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
          )}
        >
          {LOCALE_SHORT[l]}
        </button>
      ))}
    </div>
  );
}
