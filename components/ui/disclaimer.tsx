"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/localization/i18n-provider";

export function PriceDisclaimer({ className, text }: { className?: string; text?: string }) {
  const t = useT();
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl bg-clay-tint/60 px-3.5 py-2.5 text-xs leading-relaxed text-clay-dark",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{text ?? t("common.disclaimer")}</span>
    </p>
  );
}
