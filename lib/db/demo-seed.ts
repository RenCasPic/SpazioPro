import type { Database } from "./schema";
import { emptyDatabase } from "./schema";
import { createProfile, createProject } from "./factories";
import { uid } from "@/lib/utils";
import { pricingService } from "@/lib/market/pricing-service";
import { categoryMeta } from "@/data/categories";
import { productById } from "@/data/catalog";
import { baseSurfaceQuantity } from "@/lib/calculations/quantities";
import { calculateWaste } from "@/lib/calculations/materials";
import { laborRateService } from "@/lib/market/labor-rate-service";
import type { ProjectItem, ProjectType } from "@/types";

export const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "demo@spaziopro.app";

/** A calm one-point-perspective room as an SVG data URI (no binary assets). */
function roomSvg(wall: string, floor: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
<rect width='800' height='600' fill='${wall}'/>
<polygon points='0,0 800,0 560,190 240,190' fill='${shade(wall, 8)}'/>
<polygon points='240,360 560,360 800,600 0,600' fill='${floor}'/>
<rect x='500' y='150' width='190' height='170' fill='#cfe0ea' stroke='${shade(wall,-14)}' stroke-width='6'/>
<rect x='90' y='330' width='230' height='90' rx='10' fill='${accent}'/>
<rect x='360' y='300' width='90' height='120' rx='6' fill='${shade(accent,-12)}'/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
const clamp = (v: number) => Math.max(0, Math.min(255, v));

function seededItem(
  projectId: string,
  roomId: string,
  scenarioId: string,
  productId: string,
  countryCode: string,
  dims: { width: number; length: number; height: number },
  index: number,
): ProjectItem {
  const product = productById(productId)!;
  const meta = categoryMeta(product.category);
  const price = pricingService.resolve(productId, countryCode);
  const now = new Date().toISOString();
  const kind = meta.kind;
  const surface = meta.surface;
  const qty =
    kind === "surface"
      ? calculateWaste(baseSurfaceQuantity(surface, dims, product.unit), product.wastePercent)
      : 1;
  const rate = laborRateService.rate(countryCode, product.laborCategory);
  const laborCost = rate && rate.unit === product.unit ? rate.cost : 0;
  return {
    id: uid("itm"),
    projectId,
    roomId,
    scenarioId,
    productId,
    name: product.name,
    category: product.category,
    kind,
    surface: kind === "surface" ? surface : undefined,
    quantity: qty,
    quantityAuto: kind === "surface",
    unit: product.unit,
    unitPrice: price.money.amount,
    laborCost,
    currencyCode: price.money.currency,
    wastePercent: product.wastePercent,
    priceSource: price.source,
    supplier: price.supplier,
    demoPrice: product.demo,
    transform: { x: 0.3 + index * 0.12, y: 0.62, rotation: 0, scale: 1 },
    layer: index,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDemoDatabase(): Database {
  const db = emptyDatabase();
  db.profile = {
    ...createProfile(DEMO_USER_ID, DEMO_EMAIL),
    fullName: "Ana Duarte",
    companyName: "Estudio Duarte Interiorismo",
    city: "Madrid",
    phone: "+34 600 123 456",
    countryCode: "ES",
    currencyCode: "EUR",
    locale: "es-ES",
    onboardingComplete: true,
    professionalType: "interior_designer",
  };

  db.clients = [
    client("Familia García", "garcia@example.com", "Madrid"),
    client("Estudio Norte S.L.", "hola@estudionorte.com", "Bilbao", "Estudio Norte S.L."),
    client("Carlos Rolón", "carlos.rolon@example.com", "Asunción"),
  ];

  const specs: Array<{
    name: string;
    type: ProjectType;
    country: string;
    clientIdx: number;
    palette: [string, string, string];
    products: string[];
    status: import("@/types").ProjectStatus;
  }> = [
    {
      name: "Reforma salón Casa García",
      type: "living_room",
      country: "ES",
      clientIdx: 0,
      palette: ["#efe9df", "#b98f5c", "#8f9d8a"],
      products: ["flr-roble-natural", "pnt-verde-salvia", "sof-modular-3p", "lgt-lineal-suspendido", "dec-monstera-xl"],
      status: "estimating",
    },
    {
      name: "Oficina Estudio Norte",
      type: "office",
      country: "ES",
      clientIdx: 1,
      palette: ["#eef0f1", "#9a9a99", "#3d517a"],
      products: ["flr-microcemento", "pnt-blanco-roto", "lgt-foco-empotrable", "wrd-batiente-3p"],
      status: "designing",
    },
    {
      name: "Cocina apartamento Asunción",
      type: "kitchen",
      country: "PY",
      clientIdx: 2,
      palette: ["#f2efe9", "#33363a", "#c99b63"],
      products: ["flr-porcelanico-piedra", "tile-metro-blanco", "kit-mueble-mate", "cnt-encimera-cuarzo", "app-frigo-combi"],
      status: "quoted",
    },
  ];

  for (const spec of specs) {
    const created = createProject(DEMO_USER_ID, {
      name: spec.name,
      clientId: db.clients[spec.clientIdx].id,
      countryCode: spec.country,
      projectType: spec.type,
      description: "Proyecto de demostración generado automáticamente.",
    });
    created.project.status = spec.status;
    const dims = { width: created.room.width, length: created.room.length, height: created.room.height };

    db.projects.push(created.project);
    db.rooms.push(created.room);
    db.scenarios.push(...created.scenarios);
    db.configs.push(created.config);

    db.images.push({
      id: uid("img"),
      projectId: created.project.id,
      roomId: created.room.id,
      type: "original",
      originalUrl: roomSvg(...spec.palette),
      processedUrl: null,
      thumbnailUrl: null,
      designFilter: "saturate(1.06) contrast(1.03) brightness(1.02)",
      metadata: { demo: true },
      createdAt: new Date().toISOString(),
    });

    const standard = created.scenarios[0];
    spec.products.forEach((pid, i) => {
      db.items.push(
        seededItem(created.project.id, created.room.id, standard.id, pid, spec.country, dims, i),
      );
    });
  }

  return db;
}

function client(name: string, email: string, city: string, company = ""): import("@/types").Client {
  const now = new Date().toISOString();
  return {
    id: uid("cli"),
    userId: DEMO_USER_ID,
    name,
    email,
    phone: "",
    company,
    address: "",
    city,
    postalCode: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}
