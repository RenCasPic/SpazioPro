import type {
  Client,
  DesignScenario,
  Estimate,
  EstimateStatus,
  ProjectItem,
  ProjectStatus,
  ProjectType,
} from "@/types";
import { emptyDatabase, type Database } from "./schema";
import { createProfile, createProject } from "./factories";
import { uid } from "@/lib/utils";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { categoryMeta } from "@/data/categories";
import { productById } from "@/data/catalog";
import { baseSurfaceQuantity } from "@/lib/calculations/dimensions";
import { calculateWaste } from "@/lib/calculations/materials";
import { calculateEstimate } from "@/lib/calculations/estimate";
import { marketService } from "@/lib/market/market-service";
import { taxService } from "@/lib/market/tax-service";
import { projectImage } from "@/lib/media/project-image";
import { nextEstimateNumber } from "@/lib/format";
import { buildRectangularRoom } from "@/lib/spatial/room-builder";
import type { RoomModel } from "@/types";

export const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "demo@spaziopro.app";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
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

interface Spec {
  name: string;
  type: ProjectType;
  clientIdx: number;
  address: string;
  city: string;
  stateCode: string;
  zip: string;
  products: string[];
  status: ProjectStatus;
  updatedDaysAgo: number;
  estimate?: { status: EstimateStatus; daysAgo: number };
  /** seed a Semantic 3D Room Model for this project */
  roomModel?: "calibrated" | "awaiting_validation";
}

const SPECS: Spec[] = [
  {
    name: "Modern Kitchen Remodel",
    type: "kitchen",
    clientIdx: 0,
    address: "2408 Rio Grande St",
    city: "Austin",
    stateCode: "TX",
    zip: "78701",
    products: ["flr-porcelain-stone", "wal-subway-tile", "kit-shaker-cabinets", "kit-quartz-counter", "kit-ss-undermount", "lgt-chandelier-linear"],
    status: "approved",
    updatedDaysAgo: 2,
    estimate: { status: "approved", daysAgo: 4 },
    roomModel: "calibrated",
  },
  {
    name: "Primary Bath Renovation",
    type: "bathroom",
    clientIdx: 1,
    address: "1155 Vista Del Mar",
    city: "San Diego",
    stateCode: "CA",
    zip: "92101",
    products: ["bth-shower-tile", "wal-paint-eggshell", "bth-vanity-48", "bth-toilet-comfort", "bth-freestand-tub"],
    status: "quoted",
    updatedDaysAgo: 5,
    estimate: { status: "draft", daysAgo: 8 },
    roomModel: "awaiting_validation",
  },
  {
    name: "Living Room Redesign",
    type: "living_room",
    clientIdx: 2,
    address: "88 Prospect Park W",
    city: "Miami",
    stateCode: "FL",
    zip: "33131",
    products: ["flr-white-oak-solid", "wal-paint-accent", "fur-sofa-88", "lgt-floor-arc", "fur-dining-table"],
    status: "designing",
    updatedDaysAgo: 4,
    estimate: { status: "final", daysAgo: 11 },
  },
  {
    name: "Outdoor Living Space",
    type: "terrace",
    clientIdx: 0,
    address: "410 Camelback Rd",
    city: "Phoenix",
    stateCode: "AZ",
    zip: "85012",
    products: ["flr-porcelain-stone", "fur-dining-table", "fur-dining-chair", "lgt-sconce-glass"],
    status: "designing",
    updatedDaysAgo: 7,
  },
  {
    name: "Home Office Buildout",
    type: "office",
    clientIdx: 1,
    address: "77 Harbor Dr",
    city: "San Diego",
    stateCode: "CA",
    zip: "92101",
    products: ["flr-lvp-coastal", "wal-paint-eggshell", "fur-nightstand", "lgt-recessed-6"],
    status: "estimating",
    updatedDaysAgo: 12,
  },
];

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
    client("The Hendersons", "hendersons@example.com", "Austin"),
    client("Marcus Bell", "marcus.bell@example.com", "San Diego"),
    client("Priya & Sam Kapoor", "kapoor.home@example.com", "Miami"),
  ];

  for (const spec of SPECS) {
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
    created.project.createdAt = daysAgo(spec.updatedDaysAgo + 6);
    created.project.updatedAt = daysAgo(spec.updatedDaysAgo);
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
      originalUrl: projectImage(spec.type, created.project.id),
      processedUrl: null,
      thumbnailUrl: null,
      designFilter: "saturate(1.05) contrast(1.03)",
      metadata: { demo: true, stock: true },
      createdAt: created.project.createdAt,
    });

    const standard = created.scenarios[0];
    spec.products.forEach((pid, i) => {
      db.items.push(seededItem(created.project.id, created.room.id, standard.id, pid, spec.stateCode, dims, i));
    });

    if (spec.estimate) {
      db.estimates.push(
        buildDemoEstimate(created.project, created.scenarios, created.config, db.items, dims, spec),
      );
    }

    if (spec.roomModel) {
      db.roomModels.push(buildDemoRoomModel(created.project.id, created.room.id, spec, dims));
    }
  }

  return db;
}

function buildDemoRoomModel(
  projectId: string,
  roomId: string,
  spec: Spec,
  dims: { widthIn: number; lengthIn: number; heightIn: number },
): RoomModel {
  const calibrated = spec.roomModel === "calibrated";
  const model = buildRectangularRoom({
    projectId,
    roomId,
    widthIn: dims.widthIn,
    lengthIn: dims.lengthIn,
    heightIn: dims.heightIn,
    roomType: spec.type,
    source: "demo",
    captureSource: "photo",
    status: calibrated ? "ready" : "awaiting_validation",
    calibrationStatus: calibrated ? "calibrated" : "uncalibrated",
    confidence: calibrated ? 0.93 : 0.82,
    openings: [
      { wallIndex: 3, kind: "door", widthIn: 32, heightIn: 80, uIn: 14, vIn: 0, confidence: 0.9 },
      {
        wallIndex: 0,
        kind: "window",
        widthIn: 48,
        heightIn: 48,
        uIn: Math.max(12, dims.widthIn / 2 - 24),
        vIn: 36,
        confidence: calibrated ? 0.88 : 0.66,
      },
    ],
  });
  if (calibrated) {
    model.calibration.scaleFactor = 1;
    model.calibration.scaleConfidence = 0.95;
    model.entities.forEach((e) => {
      e.calibrationStatus = "calibrated";
      if (e.quantifiable) e.validationStatus = "verified";
    });
  }
  return model;
}

function buildDemoEstimate(
  project: Database["projects"][number],
  scenarios: DesignScenario[],
  config: Database["configs"][number],
  allItems: ProjectItem[],
  dims: { widthIn: number; lengthIn: number; heightIn: number },
  spec: Spec,
): Estimate {
  const sid = scenarios[0].id;
  const items = allItems.filter((i) => i.projectId === project.id && i.scenarioId === sid);
  const loc = { stateCode: spec.stateCode, city: spec.city, zipCode: spec.zip, county: null };
  const tax = taxService.getTaxRate({ stateCode: spec.stateCode, city: spec.city, zipCode: spec.zip });
  const settings = { ...config.settings, salesTaxRate: tax.rate };
  const { totals, breakdown } = calculateEstimate({
    items,
    dimensions: dims,
    measurementSource: "ai_estimate",
    laborLines: config.laborLines,
    settings,
    currency: "USD",
    hasTaxJurisdiction: tax.matchedOn !== "none",
  });
  const at = daysAgo(spec.estimate!.daysAgo);
  const snapshot = marketService.snapshot(loc, [...new Set(items.map((i) => i.productId))]);

  const id = uid("est");
  return {
    id,
    projectId: project.id,
    scenarioId: sid,
    kind: "estimate",
    estimateNumber: nextEstimateNumber([]),
    language: "en-US",
    countryCode: "US",
    stateCode: spec.stateCode,
    city: spec.city,
    zipCode: spec.zip,
    currencyCode: "USD",
    salesTaxRate: tax.rate,
    scopeOfWork:
      "Remove existing finishes. Prep substrate. Install new materials per selections. Trim and punch-list. Final clean.",
    subtotalMaterials: totals.materials,
    subtotalLabor: totals.labor,
    subtotalEquipment: totals.equipment,
    subtotalDelivery: totals.delivery,
    subtotalDisposal: totals.disposal,
    subtotalPermits: totals.permits,
    subtotalOther: totals.other,
    discount: totals.discount,
    taxAmount: totals.tax,
    total: totals.total,
    notes: "",
    status: spec.estimate!.status,
    marketSnapshot: snapshot,
    items: breakdown.map((b) => ({
      id: uid("eli"),
      estimateId: id,
      projectItemId: b.item.id,
      description: b.item.name,
      category: b.item.category,
      quantity: b.quantity,
      unit: b.item.unit,
      unitPrice: b.item.unitPrice,
      laborPrice: b.item.laborCost,
      total: b.total,
      priceSnapshot: {
        price: b.item.unitPrice,
        currency: "USD" as const,
        supplier: b.item.supplier,
        source: b.item.priceSource,
        capturedAt: at,
      },
    })),
    createdAt: at,
    updatedAt: at,
  };
}
