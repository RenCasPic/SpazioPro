"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useLocale } from "./i18n-provider";

/** Prefixes an app path with the active locale. `path` should start with "/". */
export function useLocalePath() {
  const locale = useLocale();
  return useCallback((path: string) => `/${locale}${path === "/" ? "" : path}`, [locale]);
}

export function LocaleLink({
  href,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const lp = useLocalePath();
  return <Link href={lp(href)} {...props} />;
}

export function useLocaleRouter() {
  const router = useRouter();
  const lp = useLocalePath();
  return {
    push: (path: string) => router.push(lp(path)),
    replace: (path: string) => router.replace(lp(path)),
    refresh: () => router.refresh(),
  };
}

/** Set the locale cookie and hard-switch the current path to another locale. */
export function useLocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  return useCallback(
    (next: string) => {
      try {
        document.cookie = `spaziopro.locale=${next}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        /* ignore */
      }
      const path = window.location.pathname.replace(new RegExp(`^/${locale}`), `/${next}`);
      router.push(path + window.location.search);
      router.refresh();
    },
    [locale, router],
  );
}
