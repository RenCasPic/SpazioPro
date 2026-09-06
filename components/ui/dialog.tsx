"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "animate-in relative w-full max-w-lg rounded-t-2xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)] sm:rounded-2xl",
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-ink/5 hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        {title && <h2 className="font-serif text-xl text-ink">{title}</h2>}
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        <div className={cn(title && "mt-5")}>{children}</div>
      </div>
    </div>
  );
}
