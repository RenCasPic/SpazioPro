"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { countryService } from "@/lib/market/country-service";
import { cn } from "@/lib/utils";

export function CountrySelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const countries = countryService.list();
  const current = countryService.get(value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink hover:border-ink/30"
      >
        <span className="flex items-center gap-2">
          {current ? (
            <>
              <span className="text-base">{current.flag}</span>
              <span>{current.name}</span>
              <span className="text-muted">
                · {current.currencyCode} {current.currencySymbol}
              </span>
            </>
          ) : (
            <span className="text-muted">Selecciona un país</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-paper",
                c.code === value && "bg-clay-tint",
              )}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-ink">{c.name}</span>
              <span className="text-xs text-muted">
                {c.currencyCode} {c.currencySymbol}
              </span>
              {c.code === value && <Check className="h-4 w-4 text-clay" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
