import type { LaborCategory, LaborLine, Unit } from "@/types";
import { uid } from "@/lib/utils";
import { laborRateService } from "@/lib/market/labor-rate-service";

const DEFAULTS: Array<{ label: string; category: LaborCategory; unit: Unit }> = [
  { label: "Demolition & removal", category: "demolition", unit: "sq_ft" },
  { label: "Flooring installation", category: "flooring_installation", unit: "sq_ft" },
  { label: "Painting", category: "painting", unit: "sq_ft" },
  { label: "Drywall repair", category: "drywall", unit: "sq_ft" },
  { label: "Tile installation", category: "tile_installation", unit: "sq_ft" },
  { label: "Cabinet installation", category: "cabinet_installation", unit: "linear_ft" },
  { label: "Electrical", category: "electrical", unit: "hour" },
  { label: "Plumbing", category: "plumbing", unit: "hour" },
  { label: "Final cleaning", category: "cleaning", unit: "project" },
];

const UNIT_MAP: Record<string, Unit> = {
  hour: "hour",
  day: "day",
  sq_ft: "sq_ft",
  linear_ft: "linear_ft",
  unit: "ea",
  project: "project",
};

/** Labor line items pre-filled from the state's market rates (USD). */
export function defaultLaborLines(stateCode: string): LaborLine[] {
  return DEFAULTS.map((d) => {
    const rate = laborRateService.rate(stateCode, d.category);
    return {
      id: uid("lab"),
      label: d.label,
      category: d.category,
      unit: rate ? (UNIT_MAP[rate.unit] ?? d.unit) : d.unit,
      quantity: 0,
      unitCost: rate?.cost ?? 0,
      currencyCode: "USD" as const,
      enabled: false,
      fromMarket: !!rate,
    };
  });
}
