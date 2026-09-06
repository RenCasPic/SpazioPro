import { IN_PER_FT, SQFT_PER_SQM } from "./units";

export const convertFeetToInches = (feet: number) => feet * IN_PER_FT;
export const convertInchesToFeet = (inches: number) => inches / IN_PER_FT;
export const convertSqFtToSqM = (sqft: number) => sqft / SQFT_PER_SQM;
export const convertSqMToSqFt = (sqm: number) => sqm * SQFT_PER_SQM;
export const convertLinearFt = (feet: number, to: "in" | "m" | "yd") =>
  to === "in" ? feet * 12 : to === "m" ? feet * 0.3048 : feet / 3;
