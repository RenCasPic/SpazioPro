import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

type Tone = "ok" | "info" | "warn" | "violet" | "slate" | "ink" | "accent";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  violet: "bg-violet-bg text-violet",
  slate: "bg-slate-bg text-slate",
  ink: "bg-ink text-white",
  accent: "bg-accent-tint text-accent",
};

export function Badge({
  className,
  tone,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        tone && TONE[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<ProjectStatus, Tone> = {
  draft: "slate",
  designing: "info",
  estimating: "accent",
  quoted: "violet",
  approved: "ok",
  completed: "ink",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectStatus;
  label: string;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONE[status]} dot className={className}>
      {label}
    </Badge>
  );
}

const ESTIMATE_TONE: Record<string, Tone> = {
  draft: "slate",
  final: "info",
  approved: "ok",
  archived: "slate",
};

export function EstimateStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge tone={ESTIMATE_TONE[status] ?? "slate"} dot>
      {label}
    </Badge>
  );
}
