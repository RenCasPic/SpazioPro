"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, FileText, MessageSquare } from "lucide-react";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useLocale } from "@/components/localization/i18n-provider";
import { readDb } from "@/lib/db/local-store";
import { formatDate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Notifications() {
  const locale = useLocale();
  const router = useLocaleRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = (() => {
    const db = readDb();
    return db.estimates
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((e) => {
        const project = db.projects.find((p) => p.id === e.projectId);
        const meta =
          e.status === "approved"
            ? { icon: CheckCircle2, text: `${e.estimateNumber} was approved`, cls: "text-ok" }
            : e.status === "final"
              ? { icon: MessageSquare, text: `${e.estimateNumber} sent to client`, cls: "text-info" }
              : { icon: FileText, text: `${e.estimateNumber} saved as draft`, cls: "text-slate" };
        return { id: e.id, href: `/estimates/${e.id}`, sub: `${project?.name ?? "Project"} · ${formatUsd(e.total, locale)}`, when: formatDate(e.createdAt, locale), ...meta };
      });
  })();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {items.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]">
          <div className="border-b border-line px-4 py-2.5 text-[13px] font-medium text-ink">Activity</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Nothing new</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <button
                  key={n.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className="flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-canvas"
                >
                  <n.icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.cls)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-ink">{n.text}</span>
                    <span className="block truncate text-[11px] text-muted">{n.sub}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted">{n.when}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
