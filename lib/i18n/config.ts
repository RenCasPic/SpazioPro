export const LOCALES = ["en-US", "es-US"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";

export const LOCALE_LABELS: Record<Locale, string> = {
  "en-US": "English",
  "es-US": "Español",
};

/** Short labels for the header switcher. */
export const LOCALE_SHORT: Record<Locale, string> = {
  "en-US": "EN",
  "es-US": "ES",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value ?? undefined) ? (value as Locale) : DEFAULT_LOCALE;
}
