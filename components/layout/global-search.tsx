"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, FolderKanban, Users, ReceiptText, CornerDownLeft } from "lucide-react";
import { useLocaleRouter } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { readDb } from "@/lib/db/local-store";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Result = {
  kind: "project" | "client" | "estimate";
  id: string;
  title: string;
  sub: string;
  href: string;
};

export function GlobalSearch({ className }: { className?: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useLocaleRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const db = readDb();
    const out: Result[] = [];
    for (const p of db.projects) {
      if (`${p.name} ${p.projectType}`.toLowerCase().includes(term)) {
        const loc = db.locations.find((l) => l.projectId === p.id);
        out.push({
          kind: "project",
          id: p.id,
          title: p.name,
          sub: loc ? `${loc.city}, ${loc.stateCode}` : t(`common.project_type.${p.projectType}`),
          href: `/projects/${p.id}`,
        });
      }
    }
    for (const c of db.clients) {
      if (`${c.name} ${c.company} ${c.city}`.toLowerCase().includes(term)) {
        out.push({ kind: "client", id: c.id, title: c.name, sub: c.company || c.city || "", href: "/clients" });
      }
    }
    for (const e of db.estimates) {
      if (e.estimateNumber.toLowerCase().includes(term)) {
        out.push({
          kind: "estimate",
          id: e.id,
          title: e.estimateNumber,
          sub: formatUsd(e.total, locale),
          href: `/estimates/${e.id}`,
        });
      }
    }
    return out.slice(0, 8);
  }, [q, locale, t]);

  useEffect(() => setActive(0), [q]);

  function go(r: Result) {
    setOpen(false);
    setQ("");
    router.push(r.href);
  }

  const ICON = { project: FolderKanban, client: Users, estimate: ReceiptText };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="flex h-10 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 transition-colors focus-within:border-line-strong">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter" && results[active]) go(results[active]);
          }}
          placeholder={t("common.actions.search") + "…"}
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-line-strong bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      {open && q.trim() && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">{t("catalog.no_results")}</p>
          ) : (
            results.map((r, i) => {
              const Icon = ICON[r.kind];
              return (
                <button
                  key={r.kind + r.id}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(r);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                    i === active ? "bg-canvas" : "",
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-canvas text-ink-soft">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{r.title}</span>
                    <span className="block truncate text-[11px] text-muted">{r.sub}</span>
                  </span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
