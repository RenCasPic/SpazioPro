"use client";

import { LocaleLink } from "@/components/localization/locale-link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-[22px]" : size === "sm" ? "text-[15px]" : "text-[17px]";
  const mark = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const glyph = size === "lg" ? 18 : size === "sm" ? 14 : 16;

  const inner = (
    <span className={cn("inline-flex items-center gap-2.5 display tracking-tight", text, className)}>
      <span className={cn("grid shrink-0 place-items-center rounded-[9px] bg-accent text-white", mark)} aria-hidden>
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
          <path d="M6 4h9l3 4v12H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M6 12h12M12 4v16" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
        </svg>
      </span>
      <span className="text-ink">
        Spazio<span className="text-accent">Pro</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return <LocaleLink href={href}>{inner}</LocaleLink>;
}
