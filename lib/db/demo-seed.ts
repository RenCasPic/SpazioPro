import type { Client, ProjectItem, ProjectStatus, ProjectType } from "@/types";
import { emptyDatabase, type Database } from "./schema";
import { createProfile, createProject } from "./factories";
import { uid } from "@/lib/utils";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { categoryMeta } from "@/data/categories";
import { productById } from "@/data/catalog";
import { baseSurfaceQuantity } from "@/lib/calculations/dimensions";
import { calculateWaste } from "@/lib/calculations/materials";

export const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "demo@spaziopro.app";

function roomSvg(wall: string, floor: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
<rect width='800' height='600' fill='${wall}'/>
<polygon points='0,0 800,0 560,190 240,190' fill='${shade(wall, 8)}'/>
<polygon points='240,360 560,360 800,600 0,600' fill='${floor}'/>
<rect x='500' y='150' width='190' height='170' fill='#cfe0ea' stroke='${shade(wall, -14)}' stroke-width='6'/>
<rect x='90' y='330' width='230' height='90' rx='10' fill='${accent}'/>
<rect x='360' y='300' width='90' height='120' rx='6' fill='${shade(accent, -12)}'/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function seededItem(
  projectId: string,
  roomId: string,
  scenarioId: string,
  productId: string,
  stateCode: string,
  dims: { widthIn: number; lengthIn: number; heightIn: number },
  index: number,
): ProjectItem {
  const product = productById(productId)!;
  const meta = categoryMeta(product.category);
  const price = pricingService.resolve(productId, stateCode);
  const rate = laborRateService.rate(stateCode, product.laborCategory);
  const now = new Date().toISOString();
  const surface = meta.surface;
  const qty =
    meta.kind === "surface"
      ? calculateWaste(baseSurfaceQuantity(surface, dims, product.unit), product.wastePercent)
      : 1;
  return {
    id: uid("itm"),
    projectId,
    roomId,
    scenarioId,
    productId,
    name: product.name,
    category: product.category,
    kind: meta.kind,
    surface: meta.kind === "surface" ? surface : undefined,
    quantity: qty,
    quantityAuto: meta.kind === "surface",
    unit: product.unit,
    unitPrice: price.money.amount,
    laborCost: rate && rate.unit === product.unit ? rate.cost : 0,
    currencyCode: "USD",
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

function client(name: string, email: string, city: string, company = ""): Client {
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

export function buildDemoDatabase(): Database {
  const db = emptyDatabase();
  db.profile = {
    ...createProfile(DEMO_USER_ID, DEMO_EMAIL),
    fullName: "John Rivera",
    companyName: "Rivera Build Co.",
    city: "Austin",
    phone: "(512) 555-0142",
    licenseNumber: "TX-GC-448120",
    defaultStateCode: "TX",
    defaultZip: "78701",
    onboardingComplete: true,
    professionalType: "general_contractor",
  };

  db.clients = [
    client("The Hendersons", "hendersons@example.com", "Austin", ""),
    client("Marcus Bell", "marcus.bell@example.com", "Los Angeles", ""),
    client("Priya & Sam Kapoor", "kapoor.home@example.com", "Brooklyn", ""),
  ];

  const specs: Array<{
    name: string;
    type: ProjectType;
    clientIdx: number;
    address: string;
    city: string;
    stateCode: string;
    zip: string;
    palette: [string, string, string];
    products: string[];
    status: ProjectStatus;
  }> = [
    {
      name: "Modern Kitchen Remodel",
      type: "kitchen",
      clientIdx: 0,
      address: "2408 Rio Grande St",
      city: "Austin",
      stateCode: "TX",
      zip: "78701",
      palette: ["#f2efe9", "#c99b63", "#33363a"],
      products: ["flr-porcelain-stone", "wal-subway-tile", "kit-shaker-cabinets", "kit-quartz-counter", "kit-ss-undermount", "lgt-chandelier-linear"],
      status: "estimating",
    },
    {
      name: "Primary Bath Renovation",
      type: "bathroom",
      clientIdx: 1,
      address: "1155 Vista Del Mar",
      city: "Los Angeles",
      stateCode: "CA",
      zip: "90001",
      palette: ["#eef0f1", "#b8b2a8", "#8ba07e"],
      products: ["bth-shower-tile", "wal-paint-eggshell", "bth-vanity-48", "bth-toilet-comfort", "bth-freestand-tub"],
      status: "quoted",
    },
    {
      name: "Living Room Refresh",
      type: "living_room",
      clientIdx: 2,
      address: "88 Prospect Park W",
      city: "Brooklyn",
      stateCode: "NY",
      zip: "10001",
      palette: ["#efe9df", "#b98f5c", "#3d517a"],
      products: ["flr-white-oak-solid", "wal-paint-accent", "fur-sofa-88", "lgt-floor-arc", "fur-dining-table"],
      status: "designing",
    },
  ];

  for (const spec of specs) {
    const created = createProject(DEMO_USER_ID, {
      name: spec.name,
      clientId: db.clients[spec.clientIdx].id,
      projectType: spec.type,
      description: "Demo project generated automatically.",
      address: spec.address,
      city: spec.city,
      stateCode: spec.stateCode,
      zipCode: spec.zip,
      estimateLanguage: "en-US",
    });
    created.project.status = spec.status;
    const dims = {
      widthIn: created.room.widthIn,
      lengthIn: created.room.lengthIn,
      heightIn: created.room.heightIn,
    };

    db.projects.push(created.project);
    db.locations.push(created.location);
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
      db.items.push(seededItem(created.project.id, created.room.id, standard.id, pid, spec.stateCode, dims, i));
    });
  }

  return db;
}
