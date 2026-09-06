import type { LaborCategory, Product, ProductCategory, Unit } from "@/types";
import { categoryMeta } from "./categories";

interface Seed {
  id: string;
  name: string;
  brand: string;
  sku: string;
  category: ProductCategory;
  subcategory: string;
  unit: Unit;
  color: string;
  style: string;
  description: string;
  swatch: string;
  sprite?: string;
  laborCategory: LaborCategory;
  wastePercent: number;
  /** reference US price in USD */
  basePrice: number;
}

const SEED: Seed[] = [
  // ---------- FLOORING ----------
  { id: "flr-oak-engineered", name: "Oak Engineered Hardwood", brand: "Timberline", sku: "ENG-OAK-58", category: "engineered_hardwood", subcategory: "Wide plank", unit: "sq_ft", color: "Natural Oak", style: "Transitional", description: '5/8" engineered oak, 7" wide plank, matte UV-cured finish.', swatch: "linear-gradient(115deg,#c99b63,#e8c79a 45%,#b9834a)", laborCategory: "flooring_installation", wastePercent: 8, basePrice: 7.49 },
  { id: "flr-lvp-coastal", name: "Coastal LVP 20mil", brand: "AquaGuard", sku: "LVP-CST-20", category: "lvp", subcategory: "Rigid core", unit: "sq_ft", color: "Weathered Gray", style: "Coastal", description: "20 mil wear layer, 100% waterproof, attached pad, click lock.", swatch: "linear-gradient(115deg,#8f8b83,#b6b0a5 50%,#77726a)", laborCategory: "flooring_installation", wastePercent: 8, basePrice: 3.29 },
  { id: "flr-laminate-hickory", name: "Hickory Laminate AC4", brand: "TrafficMaster", sku: "LAM-HKY-12", category: "laminate", subcategory: "12mm", unit: "sq_ft", color: "Toasted Hickory", style: "Rustic", description: "12mm AC4 laminate with beveled edge and pre-attached underlayment.", swatch: "linear-gradient(115deg,#6b4a33,#8a6647 45%,#553a29)", laborCategory: "flooring_installation", wastePercent: 8, basePrice: 2.19 },
  { id: "flr-porcelain-stone", name: "Porcelain Tile Stone-Look 12x24", brand: "Marazzi", sku: "POR-STN-1224", category: "floor_tile", subcategory: "Rectified", unit: "sq_ft", color: "Silver Travertine", style: "Contemporary", description: "Rectified porcelain, 12x24, matte finish, suitable for radiant heat.", swatch: "linear-gradient(120deg,#b8b2a8,#d9d4c9 50%,#a39c8f)", laborCategory: "tile_installation", wastePercent: 12, basePrice: 3.79 },
  { id: "flr-carpet-plush", name: "Plush Nylon Carpet + Pad", brand: "Mohawk", sku: "CPT-PLH-40", category: "carpet", subcategory: "Stainmaster", unit: "sq_ft", color: "Dove Gray", style: "Traditional", description: "40 oz stain-resistant nylon with 8 lb rebond pad included.", swatch: "linear-gradient(120deg,#a7a29a,#c3beb4)", laborCategory: "flooring_installation", wastePercent: 10, basePrice: 3.95 },
  { id: "flr-white-oak-solid", name: "Solid White Oak 3/4\"", brand: "Timberline", sku: "SLD-WOK-34", category: "hardwood", subcategory: "Site-finished", unit: "sq_ft", color: "White Oak", style: "Classic", description: 'Unfinished 3/4" solid white oak, 4" strip, sand & finish on site.', swatch: "linear-gradient(115deg,#d8b784,#b98f5c)", laborCategory: "flooring_installation", wastePercent: 8, basePrice: 9.25 },

  // ---------- WALLS ----------
  { id: "wal-paint-eggshell", name: "Interior Paint — Eggshell", brand: "Sherwin-Williams", sku: "PNT-EGG-GAL", category: "paint", subcategory: "Latex", unit: "gallon", color: "Alabaster", style: "Neutral", description: "Low-VOC acrylic latex, eggshell sheen, ~350 sq ft per gallon.", swatch: "linear-gradient(120deg,#f4f1ea,#ffffff 60%,#e7e2d7)", laborCategory: "painting", wastePercent: 5, basePrice: 62 },
  { id: "wal-paint-accent", name: "Interior Paint — Matte Accent", brand: "Benjamin Moore", sku: "PNT-ACC-GAL", category: "paint", subcategory: "Latex", unit: "gallon", color: "Hale Navy", style: "Elegant", description: "Premium matte latex for accent walls, deep base, high hide.", swatch: "linear-gradient(120deg,#2b3a55,#3d517a 55%,#1f2c44)", laborCategory: "painting", wastePercent: 5, basePrice: 74 },
  { id: "wal-drywall-half", name: "1/2\" Drywall + Finish", brand: "USG", sku: "DRY-HALF-STD", category: "drywall", subcategory: "Level 4", unit: "sq_ft", color: "White", style: "New construction", description: '1/2" gypsum board, hung, taped and finished to Level 4.', swatch: "linear-gradient(120deg,#dcdcdc,#c2c2c2)", laborCategory: "drywall", wastePercent: 10, basePrice: 2.6 },
  { id: "wal-subway-tile", name: "Ceramic Subway Tile 3x6", brand: "Daltile", sku: "SUB-WHT-36", category: "wall_tile", subcategory: "Glossy", unit: "sq_ft", color: "Arctic White", style: "Classic", description: "3x6 glossy ceramic subway tile for kitchen and bath walls.", swatch: "linear-gradient(120deg,#eef1f0,#ffffff 55%,#dfe4e2)", laborCategory: "tile_installation", wastePercent: 12, basePrice: 2.49 },
  { id: "wal-shiplap", name: "Primed Shiplap Paneling", brand: "UFP-Edge", sku: "SHP-PRM-6", category: "wood_paneling", subcategory: "Nickel gap", unit: "sq_ft", color: "White (primed)", style: "Farmhouse", description: "Pre-primed pine nickel-gap shiplap, 5.5\" face, ready to paint.", swatch: "repeating-linear-gradient(0deg,#f0efe9 0 8px,#e2e0d7 8px 10px)", laborCategory: "finish_carpentry", wastePercent: 10, basePrice: 3.1 },
  { id: "wal-wainscot-kit", name: "Recessed Panel Wainscoting Kit", brand: "House of Fara", sku: "WSC-RCP-32", category: "wainscoting", subcategory: "MDF", unit: "linear_ft", color: "White (primed)", style: "Traditional", description: "32\" tall MDF recessed-panel wainscoting with rail and cap.", swatch: "linear-gradient(180deg,#f6f5f2,#e6e4de)", laborCategory: "finish_carpentry", wastePercent: 10, basePrice: 24 },

  // ---------- KITCHEN ----------
  { id: "kit-shaker-cabinets", name: "Shaker Cabinets — Painted", brand: "CraftMark", sku: "CAB-SHK-WHT", category: "cabinets", subcategory: "Semi-custom", unit: "linear_ft", color: "White", style: "Shaker", description: "Semi-custom painted maple Shaker cabinets, soft-close, per linear ft.", swatch: "linear-gradient(120deg,#f2efe9,#e2ded4)", sprite: "🗄️", laborCategory: "cabinet_installation", wastePercent: 0, basePrice: 280 },
  { id: "kit-quartz-counter", name: "Quartz Countertop — 3cm", brand: "Silestone", sku: "CTP-QTZ-3CM", category: "countertops", subcategory: "Fabricated + installed", unit: "sq_ft", color: "Calacatta Gold", style: "Contemporary", description: "3cm engineered quartz, fabricated and installed, eased edge.", swatch: "linear-gradient(120deg,#eef1f2,#dde1e3)", laborCategory: "countertop_installation", wastePercent: 8, basePrice: 68 },
  { id: "kit-marble-backsplash", name: "Marble Mosaic Backsplash", brand: "MSI", sku: "BSP-MRB-HEX", category: "backsplash", subcategory: "Hexagon mosaic", unit: "sq_ft", color: "Carrara", style: "Classic", description: "2\" hexagon Carrara marble mosaic on mesh, honed finish.", swatch: "radial-gradient(circle at 30% 30%,#f2f2f0,#d9dad7)", laborCategory: "tile_installation", wastePercent: 12, basePrice: 18.5 },
  { id: "kit-ss-undermount", name: "Stainless Undermount Sink 32\"", brand: "Kraus", sku: "SNK-USM-32", category: "kitchen_sink", subcategory: "16-gauge", unit: "ea", color: "Stainless", style: "Contemporary", description: "32\" single-bowl 16-gauge stainless undermount with grid and drain.", swatch: "linear-gradient(120deg,#b9bec3,#d7dbde)", sprite: "🚰", laborCategory: "plumbing", wastePercent: 0, basePrice: 320 },
  { id: "kit-pulldown-faucet", name: "Pull-Down Kitchen Faucet", brand: "Moen", sku: "FCT-PLD-SS", category: "faucet", subcategory: "Single handle", unit: "ea", color: "Spot Resist Stainless", style: "Transitional", description: "Single-handle pull-down faucet with power-clean spray.", swatch: "linear-gradient(120deg,#c9ccd0,#eceef0)", sprite: "🚿", laborCategory: "plumbing", wastePercent: 0, basePrice: 219 },
  { id: "kit-slidein-range", name: "Slide-In Gas Range 30\"", brand: "GE Profile", sku: "APP-RNG-30", category: "appliance", subcategory: "Convection", unit: "ea", color: "Stainless", style: "Contemporary", description: "30\" slide-in gas range, 5 burners, true convection, air fry.", swatch: "linear-gradient(120deg,#1f1f22,#3a3a3e)", sprite: "🔥", laborCategory: "assembly", wastePercent: 0, basePrice: 1899 },

  // ---------- BATHROOM ----------
  { id: "bth-vanity-48", name: "48\" Bath Vanity + Top", brand: "Home Decorators", sku: "VAN-48-GRY", category: "vanity", subcategory: "Single sink", unit: "ea", color: "Sage Green", style: "Transitional", description: "48\" vanity with soft-close doors and cultured marble top.", swatch: "linear-gradient(120deg,#8ba07e,#a9bd9d 55%,#748c66)", sprite: "🪞", laborCategory: "plumbing", wastePercent: 0, basePrice: 749 },
  { id: "bth-toilet-comfort", name: "Comfort-Height Toilet", brand: "Kohler", sku: "TLT-CMF-12", category: "toilet", subcategory: "1.28 GPF", unit: "ea", color: "White", style: "Contemporary", description: "Two-piece comfort-height elongated toilet, 1.28 GPF, seat included.", swatch: "linear-gradient(120deg,#f2f4f5,#e0e3e5)", sprite: "🚽", laborCategory: "plumbing", wastePercent: 0, basePrice: 289 },
  { id: "bth-shower-base", name: "Alcove Shower Base 60x32", brand: "Swan", sku: "SHW-BSE-6032", category: "shower", subcategory: "Solid surface", unit: "ea", color: "White", style: "Contemporary", description: "60x32 solid-surface shower base, center drain, tile-ready flange.", swatch: "linear-gradient(120deg,#f4f4f2,#e2e2df)", sprite: "🚿", laborCategory: "plumbing", wastePercent: 0, basePrice: 399 },
  { id: "bth-freestand-tub", name: "Freestanding Soaking Tub 67\"", brand: "Signature Hardware", sku: "TUB-FS-67", category: "bathtub", subcategory: "Acrylic", unit: "ea", color: "Matte White", style: "Spa", description: "67\" double-ended acrylic freestanding tub with center drain.", swatch: "linear-gradient(120deg,#f4f4f2,#e2e2df)", sprite: "🛁", laborCategory: "plumbing", wastePercent: 0, basePrice: 1290 },
  { id: "bth-shower-tile", name: "Ceramic Wall Tile 4x12 (Shower)", brand: "Daltile", sku: "SHT-4x12-BSC", category: "bath_tile", subcategory: "Matte", unit: "sq_ft", color: "Biscuit", style: "Classic", description: "4x12 matte ceramic wall tile for tub and shower surrounds.", swatch: "linear-gradient(120deg,#efe9df,#ddd5c6)", laborCategory: "tile_installation", wastePercent: 12, basePrice: 2.85 },
  { id: "bth-shower-trim", name: "Shower Trim Kit + Valve", brand: "Delta", sku: "FIX-SHW-BLK", category: "fixture", subcategory: "Pressure-balance", unit: "ea", color: "Matte Black", style: "Modern", description: "Single-function shower trim with rough-in valve, matte black.", swatch: "linear-gradient(120deg,#2a2a2c,#48484b)", sprite: "🔧", laborCategory: "plumbing", wastePercent: 0, basePrice: 245 },

  // ---------- FURNITURE ----------
  { id: "fur-sofa-88", name: "88\" Track-Arm Sofa", brand: "Article", sku: "SOF-TRK-88", category: "sofa", subcategory: "Performance fabric", unit: "ea", color: "Pearl Gray", style: "Contemporary", description: "88\" sofa in stain-resistant performance weave, feather-blend cushions.", swatch: "linear-gradient(160deg,#9aa0a8,#b8bcc0)", sprite: "🛋️", laborCategory: "assembly", wastePercent: 0, basePrice: 1499 },
  { id: "fur-sectional-l", name: "L-Shaped Sectional w/ Chaise", brand: "Burrow", sku: "SEC-LSH-CH", category: "sectional", subcategory: "Modular", unit: "ea", color: "Charcoal", style: "Modern", description: "Modular L-sectional with reversible chaise and USB console option.", swatch: "linear-gradient(160deg,#3a3a3c,#5a5a5c)", sprite: "🛋️", laborCategory: "assembly", wastePercent: 0, basePrice: 2390 },
  { id: "fur-dining-table", name: "Solid Wood Dining Table 72\"", brand: "West Elm", sku: "TBL-DIN-72", category: "table", subcategory: "Seats 6", unit: "ea", color: "Walnut", style: "Mid-century", description: "72\" solid acacia dining table with tapered legs, seats 6.", swatch: "linear-gradient(120deg,#6b4a33,#8a6647)", sprite: "🍽️", laborCategory: "assembly", wastePercent: 0, basePrice: 1099 },
  { id: "fur-dining-chair", name: "Upholstered Dining Chair", brand: "Article", sku: "CHR-UPH-01", category: "chair", subcategory: "Set staple", unit: "ea", color: "Camel", style: "Mid-century", description: "Wood-frame dining chair with boucle seat and back.", swatch: "linear-gradient(120deg,#c9a97a,#e4cfa8)", sprite: "🪑", laborCategory: "assembly", wastePercent: 0, basePrice: 189 },
  { id: "fur-queen-bed", name: "Upholstered Queen Bed", brand: "Thuma", sku: "BED-UPH-Q", category: "bed", subcategory: "Platform", unit: "ea", color: "Oat Linen", style: "Warm minimal", description: "Queen upholstered platform bed with wraparound headboard, no box spring.", swatch: "linear-gradient(150deg,#d9ccb6,#c3b294)", sprite: "🛏️", laborCategory: "assembly", wastePercent: 0, basePrice: 995 },
  { id: "fur-nightstand", name: "2-Drawer Nightstand", brand: "West Elm", sku: "NST-2DR-OAK", category: "nightstand", subcategory: "Oak", unit: "ea", color: "Natural Oak", style: "Mid-century", description: "Two-drawer nightstand in white oak with tapered legs.", swatch: "linear-gradient(120deg,#d8b784,#b98f5c)", sprite: "🗄️", laborCategory: "assembly", wastePercent: 0, basePrice: 349 },

  // ---------- LIGHTING ----------
  { id: "lgt-pendant-brass", name: "Brass Dome Pendant", brand: "Cedar & Moss", sku: "PND-DOM-BRS", category: "pendant", subcategory: "Single", unit: "ea", color: "Brass", style: "Mid-century", description: "8\" spun brass dome pendant, medium base, cloth cord.", swatch: "radial-gradient(circle at 40% 35%,#fff5dd,#c9a24a)", sprite: "💡", laborCategory: "electrical", wastePercent: 0, basePrice: 189 },
  { id: "lgt-chandelier-linear", name: "Linear Island Chandelier", brand: "Hinkley", sku: "CHD-LIN-5", category: "chandelier", subcategory: "5-light", unit: "ea", color: "Black / Brass", style: "Transitional", description: "5-light linear chandelier for kitchen islands, adjustable rods.", swatch: "linear-gradient(120deg,#26262a,#3d3d42)", sprite: "💡", laborCategory: "electrical", wastePercent: 0, basePrice: 449 },
  { id: "lgt-recessed-6", name: "6\" LED Recessed Downlight", brand: "Halo", sku: "RCS-LED-6", category: "recessed", subcategory: "Canless", unit: "ea", color: "White", style: "Technical", description: "6\" canless LED downlight, 5-CCT selectable, wet-rated, dimmable.", swatch: "radial-gradient(circle at 50% 40%,#f7f7f7,#2c2c2c 75%)", sprite: "🔦", laborCategory: "electrical", wastePercent: 0, basePrice: 24 },
  { id: "lgt-sconce-glass", name: "Opal Glass Wall Sconce", brand: "Hudson Valley", sku: "SCN-OPL-01", category: "wall_sconce", subcategory: "ADA", unit: "ea", color: "Brass / Opal", style: "Classic", description: "ADA-compliant sconce with hand-blown opal glass shade.", swatch: "radial-gradient(circle at 40% 35%,#fff5dd,#c9a24a)", sprite: "🔆", laborCategory: "electrical", wastePercent: 0, basePrice: 159 },
  { id: "lgt-floor-arc", name: "Arc Floor Lamp — Marble Base", brand: "Lumens", sku: "FLR-ARC-01", category: "floor_lamp", subcategory: "Arc", unit: "ea", color: "Steel / White", style: "Elegant", description: "Marble base arc floor lamp with adjustable steel arm.", swatch: "linear-gradient(120deg,#c9ccd0,#eceef0)", sprite: "🛋️", laborCategory: "assembly", wastePercent: 0, basePrice: 289 },
  { id: "lgt-table-ceramic", name: "Ceramic Table Lamp (pair)", brand: "Threshold", sku: "TBL-CER-2", category: "table_lamp", subcategory: "Pair", unit: "ea", color: "Ivory", style: "Transitional", description: "Pair of ceramic table lamps with linen drum shades.", swatch: "linear-gradient(120deg,#efe9df,#ddd5c6)", sprite: "💡", laborCategory: "assembly", wastePercent: 0, basePrice: 129 },
];

export const CATALOG: Product[] = SEED.map((s) => ({
  id: s.id,
  name: s.name,
  sku: s.sku,
  brand: s.brand,
  category: s.category,
  group: categoryMeta(s.category).group,
  subcategory: s.subcategory,
  description: s.description,
  imageUrl: null,
  swatch: s.swatch,
  sprite: s.sprite,
  unit: s.unit,
  color: s.color,
  style: s.style,
  surface: categoryMeta(s.category).surface,
  laborCategory: s.laborCategory,
  wastePercent: s.wastePercent,
  demo: true,
}));

export const BASE_PRICE_USD: Record<string, number> = Object.fromEntries(
  SEED.map((s) => [s.id, s.basePrice]),
);

export const productById = (id: string): Product | undefined => CATALOG.find((p) => p.id === id);
