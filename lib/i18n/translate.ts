import type { Dictionary } from "./dictionaries";
import type { Locale } from "./config";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function lookup(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/**
 * Builds a `t` function for a dictionary. Keys are `namespace.path.to.value`
 * (e.g. `common.actions.save`). Missing keys return the key itself so gaps
 * are obvious rather than silent.
 */
export function createTranslator(dict: Dictionary): TFunction {
  return (key, vars) => {
    const value = lookup(dict, key);
    if (typeof value === "string") return interpolate(value, vars);
    return key;
  };
}

export function translateWith(dict: Dictionary, key: string, vars?: Record<string, string | number>): string {
  return createTranslator(dict)(key, vars);
}

export type { Locale };
