"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "@/components/localization/locale-link";
import { useT, useLocale } from "@/components/localization/i18n-provider";
import { cn } from "@/lib/utils";

const TABS = [
  { seg: "", key: "overview" },
  { seg: "editor", key: "editor" },
  { seg: "images", key: "images" },
  { seg: "estimate", key: "estimate" },
  { seg: "scenarios", key: "scenarios" },
  { seg: "settings", key: "settings" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const base = `/${locale}/projects/${projectId}`;

  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const href = tab.seg ? `/projects/${projectId}/${tab.seg}` : `/projects/${projectId}`;
        const full = tab.seg ? `${base}/${tab.seg}` : base;
        const active = tab.seg ? pathname.startsWith(full) : pathname === base;
        return (
          <LocaleLink
            key={tab.key}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "border-clay text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t(`projects.tabs.${tab.key}`)}
          </LocaleLink>
        );
      })}
    </div>
  );
}
