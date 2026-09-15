import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden overflow-x-auto rounded-2xl border border-line bg-surface", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-line bg-canvas/60">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TH({
  className,
  align = "left",
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted",
        align === "right" && "text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TR({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const interactive = Boolean(onClick);
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-line last:border-0",
        interactive && "cursor-pointer transition-colors hover:bg-canvas",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  className,
  align = "left",
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return (
    <td
      className={cn("px-4 py-3 align-middle text-ink", align === "right" && "text-right tabular-nums", className)}
      {...props}
    >
      {children}
    </td>
  );
}
