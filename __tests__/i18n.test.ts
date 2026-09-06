import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createTranslator } from "@/lib/i18n/translate";
import { LOCALES } from "@/lib/i18n/config";
import { formatUsd } from "@/lib/format";
import { formatArea, formatImperialMeasurement } from "@/lib/calculations/units";

describe("i18n + formatting", () => {
  it("both locales resolve the same keys", () => {
    const en = createTranslator(getDictionary("en-US"));
    const es = createTranslator(getDictionary("es-US"));
    expect(en("common.actions.create_estimate")).toBe("Create Estimate");
    expect(es("common.actions.create_estimate")).toBe("Crear estimado");
    expect(en("estimates.cost_lines.sales_tax")).toBe("Sales Tax");
    expect(es("estimates.cost_lines.sales_tax")).toBe("Impuesto sobre ventas");
  });

  it("interpolates variables", () => {
    const t = createTranslator(getDictionary("en-US"));
    expect(t("editor.lead_time", { days: 7 })).toBe("7-day lead time");
    expect(t("estimates.generated", { number: "SP-2026-0001" })).toContain("SP-2026-0001");
  });

  it("missing keys return the key (visible gaps)", () => {
    const t = createTranslator(getDictionary("en-US"));
    expect(t("nope.not.here")).toBe("nope.not.here");
  });

  it("no dictionary namespace is missing keys the other has", () => {
    const flat = (o: unknown, p = ""): string[] =>
      typeof o === "object" && o
        ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, p ? `${p}.${k}` : k))
        : [p];
    for (const ns of ["common", "estimates", "projects", "editor", "pdf"] as const) {
      const enKeys = flat(getDictionary("en-US")[ns]).sort();
      const esKeys = flat(getDictionary("es-US")[ns]).sort();
      expect(esKeys).toEqual(enKeys);
    }
  });

  it("money is USD in both locales; measurements are imperial", () => {
    LOCALES.forEach((l) => expect(formatUsd(1200, l)).toMatch(/\$/));
    expect(formatArea(180, "imperial", "en-US")).toBe("180 sq ft");
    expect(formatImperialMeasurement(102)).toBe("8 ft 6 in");
  });
});
