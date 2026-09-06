import type { LaborLine } from "@/types";
import { uid } from "@/lib/utils";

/** Default labour lines offered on every new project. */
export function defaultLaborLines(): LaborLine[] {
  return [
    { id: uid("lab"), label: "Instalación de suelo", unit: "m2", quantity: 0, price: 16, enabled: false },
    { id: uid("lab"), label: "Pintura de paredes y techo", unit: "m2", quantity: 0, price: 7, enabled: false },
    { id: uid("lab"), label: "Alicatado", unit: "m2", quantity: 0, price: 28, enabled: false },
    { id: uid("lab"), label: "Montaje de mobiliario", unit: "h", quantity: 8, price: 32, enabled: false },
    { id: uid("lab"), label: "Instalación eléctrica", unit: "global", quantity: 1, price: 450, enabled: false },
    { id: uid("lab"), label: "Fontanería", unit: "global", quantity: 1, price: 520, enabled: false },
    { id: uid("lab"), label: "Retirada de escombros", unit: "global", quantity: 1, price: 180, enabled: false },
  ];
}
