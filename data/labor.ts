import type { LaborLine } from "@/types";
import { uid } from "@/lib/utils";
import { countryService } from "@/lib/market/country-service";
import { laborRateService } from "@/lib/market/labor-rate-service";

const DEFAULTS: Array<{ label: string; category: import("@/types").LaborCategory; unit: import("@/types").Unit }> = [
  { label: "Instalación de suelo", category: "flooring", unit: "m2" },
  { label: "Pintura de paredes y techo", category: "painting", unit: "m2" },
  { label: "Alicatado", category: "tiling", unit: "m2" },
  { label: "Montaje de mobiliario", category: "assembly", unit: "h" },
  { label: "Instalación eléctrica", category: "electrical", unit: "h" },
  { label: "Fontanería", category: "plumbing", unit: "h" },
  { label: "Retirada de escombros", category: "demolition", unit: "m2" },
];

/** Labour lines pre-filled from the country's market rates. */
export function defaultLaborLines(countryCode: string): LaborLine[] {
  const currency = countryService.require(countryCode).currencyCode;
  return DEFAULTS.map((d) => {
    const rate = laborRateService.rate(countryCode, d.category);
    return {
      id: uid("lab"),
      label: d.label,
      category: d.category,
      unit: d.unit,
      quantity: 0,
      unitCost: rate?.cost ?? 0,
      currencyCode: currency,
      enabled: false,
      fromMarket: !!rate,
    };
  });
}
