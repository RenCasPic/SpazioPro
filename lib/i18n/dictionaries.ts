import type { Locale } from "./config";

import enCommon from "@/locales/en-US/common.json";
import enDashboard from "@/locales/en-US/dashboard.json";
import enProjects from "@/locales/en-US/projects.json";
import enEditor from "@/locales/en-US/editor.json";
import enEstimates from "@/locales/en-US/estimates.json";
import enCatalog from "@/locales/en-US/catalog.json";
import enSettings from "@/locales/en-US/settings.json";
import enOnboarding from "@/locales/en-US/onboarding.json";
import enPdf from "@/locales/en-US/pdf.json";

import esCommon from "@/locales/es-US/common.json";
import esDashboard from "@/locales/es-US/dashboard.json";
import esProjects from "@/locales/es-US/projects.json";
import esEditor from "@/locales/es-US/editor.json";
import esEstimates from "@/locales/es-US/estimates.json";
import esCatalog from "@/locales/es-US/catalog.json";
import esSettings from "@/locales/es-US/settings.json";
import esOnboarding from "@/locales/es-US/onboarding.json";
import esPdf from "@/locales/es-US/pdf.json";

export type Dictionary = {
  common: typeof enCommon;
  dashboard: typeof enDashboard;
  projects: typeof enProjects;
  editor: typeof enEditor;
  estimates: typeof enEstimates;
  catalog: typeof enCatalog;
  settings: typeof enSettings;
  onboarding: typeof enOnboarding;
  pdf: typeof enPdf;
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  "en-US": {
    common: enCommon,
    dashboard: enDashboard,
    projects: enProjects,
    editor: enEditor,
    estimates: enEstimates,
    catalog: enCatalog,
    settings: enSettings,
    onboarding: enOnboarding,
    pdf: enPdf,
  },
  "es-US": {
    common: esCommon,
    dashboard: esDashboard,
    projects: esProjects,
    editor: esEditor,
    estimates: esEstimates,
    catalog: esCatalog,
    settings: esSettings,
    onboarding: esOnboarding,
    pdf: esPdf,
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES["en-US"];
}
