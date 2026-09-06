export const IN_PER_FT = 12;
export const SQFT_PER_SQM = 10.7639;
export const SQIN_PER_SQFT = 144;

export interface FeetInches {
  feet: number;
  inches: number;
}

export function toInches({ feet, inches }: FeetInches): number {
  return Math.max(0, feet) * IN_PER_FT + Math.max(0, inches);
}

export function fromInches(totalInches: number): FeetInches {
  const total = Math.max(0, Math.round(totalInches));
  return { feet: Math.floor(total / IN_PER_FT), inches: total % IN_PER_FT };
}

export function inchesToFeet(totalInches: number): number {
  return totalInches / IN_PER_FT;
}

export function feetToInches(feet: number): number {
  return feet * IN_PER_FT;
}

export function sqFtToSqM(sqft: number): number {
  return sqft / SQFT_PER_SQM;
}

export function sqMToSqFt(sqm: number): number {
  return sqm * SQFT_PER_SQM;
}

/** "12 ft 6 in" (imperial) / '3.81 m' (metric) */
export function formatImperialMeasurement(
  totalInches: number,
  system: "imperial" | "metric" = "imperial",
  locale = "en-US",
): string {
  if (system === "metric") {
    const meters = totalInches * 0.0254;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(meters)} m`;
  }
  const { feet, inches } = fromInches(totalInches);
  return inches > 0 ? `${feet} ft ${inches} in` : `${feet} ft`;
}

export function formatArea(
  sqft: number,
  system: "imperial" | "metric" = "imperial",
  locale = "en-US",
): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: system === "metric" ? 2 : 0 });
  return system === "metric" ? `${nf.format(sqFtToSqM(sqft))} m²` : `${nf.format(sqft)} sq ft`;
}

export function formatLinear(
  linft: number,
  system: "imperial" | "metric" = "imperial",
  locale = "en-US",
): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: system === "metric" ? 2 : 1 });
  return system === "metric" ? `${nf.format(linft * 0.3048)} m` : `${nf.format(linft)} linear ft`;
}
