"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToasts } from "@/lib/toast";

const ICON = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="animate-in pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border border-line bg-ink px-4 py-3 text-left text-sm text-white shadow-[var(--shadow-pop)]"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-clay-tint" />
            <span>{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
