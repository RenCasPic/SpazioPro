import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        className,
      )}
      {...props}
    />
  );
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-line text-ink-soft",
  designing: "bg-clay-tint text-clay-dark",
  estimated: "bg-sage/15 text-sage",
  finished: "bg-ink text-white",
};

export function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
