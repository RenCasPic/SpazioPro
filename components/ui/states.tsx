import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-line/60 shimmer", className)} />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-ink-soft">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-[15px] text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  retryLabel = "Try again",
  onRetry,
}: {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-medium underline">
          {retryLabel}
        </button>
      )}
    </div>
  );
}
