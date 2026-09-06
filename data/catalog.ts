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
  /** reference price in EUR — markets provide their own local prices */
  basePriceEur: number;
}

const SEED: Seed[] = [
  // ---------- SUELOS (5) ----------
  { id: "flr-roble-natural", name: "Roble Natural Premium", brand: "Nordholz", sku: "AC5-ROB-01", category: "floor", subcategory: "Laminado", unit: "m2", color: "Miel", style: "Nórdico", description: "Suelo laminado AC5, lamas anchas, acabado mate antihuella.", swatch: "linear-gradient(115deg,#c99b63,#e8c79a 45%,#b9834a)", laborCategory: "flooring", wastePercent: 8, basePriceEur: 32 },
  { id: "flr-porcelanico-piedra", name: "Porcelánico Efecto Piedra", brand: "Grescer", sku: "PORC-STN-60", category: "floor", subcategory: "Porcelánico", unit: "m2", color: "Gris arena", style: "Contemporáneo", description: "Gres porcelánico rectificado 60×60, apto para suelo radiante.", swatch: "linear-gradient(120deg,#b8b2a8,#d9d4c9 50%,#a39c8f)", laborCategory: "tiling", wastePercent: 10, basePriceEur: 41 },
  { id: "flr-microcemento", name: "Microcemento Continuo", brand: "Betonic", sku: "MCTO-URB", category: "microcement", subcategory: "Continuo", unit: "m2", color: "Gris urbano", style: "Industrial", description: "Revestimiento continuo sin juntas, 3 mm, sellado poliuretano.", swatch: "linear-gradient(120deg,#9a9a99,#c2c2be 50%,#868684)", laborCategory: "masonry", wastePercent: 8, basePriceEur: 68 },
  { id: "flr-vinilico-nogal", name: "Vinílico SPC Nogal", brand: "Nordholz", sku: "SPC-NOG-22", category: "wood", subcategory: "Vinílico rígido", unit: "m2", color: "Nogal oscuro", style: "Cálido", description: "Lama vinílica rígida con click, 100% resistente al agua.", swatch: "linear-gradient(115deg,#6b4a33,#8a6647 45%,#553a29)", laborCategory: "flooring", wastePercent: 8, basePriceEur: 26 },
  { id: "flr-terrazo", name: "Baldosa Terrazo Veneciano", brand: "Grescer", sku: "TRZ-VEN-40", category: "floor", subcategory: "Terrazo", unit: "m2", color: "Crema moteado", style: "Retro", description: "Terrazo prensado 40×40 con áridos de mármol.", swatch: "radial-gradient(circle at 30% 30%,#efe9dd,#cfc7b4)", laborCategory: "tiling", wastePercent: 10, basePriceEur: 54 },

  // ---------- PAREDES / PINTURA (5) ----------
  { id: "pnt-blanco-roto", name: "Pintura Plástica Mate Blanco Roto", brand: "Cromia", sku: "MATE-BR-12", category: "paint", subcategory: "Plástica", unit: "m2", color: "Blanco roto", style: "Neutro", description: "Pintura lavable transpirable, bajo COV, rendimiento 10 m²/L.", swatch: "linear-gradient(120deg,#f4f1ea,#ffffff 60%,#e7e2d7)", laborCategory: "painting", wastePercent: 5, basePriceEur: 8 },
  { id: "pnt-verde-salvia", name: "Pintura Mineral Verde Salvia", brand: "Cromia", sku: "MIN-SLV-08", category: "paint", subcategory: "Al silicato", unit: "m2", color: "Verde salvia", style: "Mediterráneo", description: "Pintura al silicato, acabado aterciopelado, alta cubrición.", swatch: "linear-gradient(120deg,#8ba07e,#a9bd9d 55%,#748c66)", laborCategory: "painting", wastePercent: 5, basePriceEur: 12 },
  { id: "tile-metro-blanco", name: "Azulejo Metro Blanco Brillo", brand: "Ceramya", sku: "MTR-BLA-75", category: "tile", subcategory: "Metro", unit: "m2", color: "Blanco", style: "Clásico", description: "Azulejo 7,5×15 tipo metro, junta biselada, cocina y baño.", swatch: "linear-gradient(120deg,#eef1f0,#ffffff 55%,#dfe4e2)", laborCategory: "tiling", wastePercent: 12, basePriceEur: 24 },
  { id: "cld-madera-nogal", name: "Revestimiento Lamas de Nogal", brand: "Nordholz", sku: "LAM-NOG-30", category: "wood", subcategory: "Panel acústico", unit: "m2", color: "Nogal", style: "Cálido", description: "Panel acústico de lamas sobre fieltro, mejora la reverberación.", swatch: "repeating-linear-gradient(90deg,#5c3f2c 0 6px,#7a5638 6px 12px)", laborCategory: "carpentry", wastePercent: 8, basePriceEur: 58 },
  { id: "stn-travertino", name: "Travertino Romano Pulido", brand: "Petra", sku: "TRV-ROM-01", category: "stone", subcategory: "Piedra natural", unit: "m2", color: "Crema", style: "Atemporal", description: "Plaqueta de travertino natural, sellado antimanchas incluido.", swatch: "linear-gradient(120deg,#d9c7a6,#efe3cb 55%,#c6b39a)", laborCategory: "tiling", wastePercent: 12, basePriceEur: 92 },

  // ---------- MUEBLES (5) ----------
  { id: "sof-modular-3p", name: "Sofá Modular 3 Plazas Bruma", brand: "Kaddo", sku: "BRM-3P-GRY", category: "sofa", subcategory: "Modular", unit: "ud", color: "Gris perla", style: "Contemporáneo", description: "Chaise longue reversible, tapizado en chenilla antimanchas.", swatch: "linear-gradient(160deg,#9aa0a8,#b8bcc0)", sprite: "🛋️", laborCategory: "assembly", wastePercent: 0, basePriceEur: 1249 },
  { id: "tbl-comedor-roble", name: "Mesa de Comedor Roble Macizo 180", brand: "Fusta", sku: "COM-RBL-180", category: "table", subcategory: "Comedor", unit: "ud", color: "Roble natural", style: "Nórdico", description: "Sobre de roble macizo aceitado, 180×90, para 6 comensales.", swatch: "linear-gradient(120deg,#c99b63,#e0bd8c)", sprite: "🍽️", laborCategory: "assembly", wastePercent: 0, basePriceEur: 749 },
  { id: "chr-nordica-roble", name: "Silla Nórdica Roble y Cuerda", brand: "Fusta", sku: "NRD-CRD-01", category: "chair", subcategory: "Comedor", unit: "ud", color: "Roble", style: "Nórdico", description: "Asiento de cuerda de papel trenzada, estructura de roble macizo.", swatch: "linear-gradient(120deg,#d8b784,#b98f5c)", sprite: "🪑", laborCategory: "assembly", wastePercent: 0, basePriceEur: 129 },
  { id: "bed-tapizado-160", name: "Cama Tapizada Lino 160", brand: "Kaddo", sku: "LIN-160-BEI", category: "bed", subcategory: "Canapé", unit: "ud", color: "Beige lino", style: "Cálido", description: "Canapé abatible incluido, cabecero acolchado de 120 cm.", swatch: "linear-gradient(150deg,#d9ccb6,#c3b294)", sprite: "🛏️", laborCategory: "assembly", wastePercent: 0, basePriceEur: 659 },
  { id: "wrd-batiente-3p", name: "Armario Batiente 3 Puertas Roble", brand: "Ordna", sku: "BAT-3P-RBL", category: "wardrobe", subcategory: "Batiente", unit: "ud", color: "Roble claro", style: "Nórdico", description: "Interior configurable, cierre amortiguado, 150×220×60.", swatch: "linear-gradient(120deg,#cdae82,#e0c69a)", sprite: "🚪", laborCategory: "carpentry", wastePercent: 0, basePriceEur: 890 },

  // ---------- ILUMINACIÓN (5) ----------
  { id: "lgt-lineal-suspendido", name: "Lámpara Lineal Suspendida LED 120", brand: "Lumen", sku: "LIN-120-BLK", category: "lighting", subcategory: "Suspensión", unit: "ud", color: "Negro", style: "Minimalista", description: "Perfil de aluminio, 3000 K, 3200 lm, regulable con TRIAC.", swatch: "linear-gradient(120deg,#26262a,#3d3d42)", sprite: "💡", laborCategory: "electrical", wastePercent: 0, basePriceEur: 219 },
  { id: "lgt-aplique-vidrio", name: "Aplique de Pared Vidrio Opal", brand: "Lumen", sku: "APL-OPL-02", category: "lighting", subcategory: "Aplique", unit: "ud", color: "Latón / opal", style: "Clásico", description: "Difusor de vidrio soplado, casquillo E27, luz cálida difusa.", swatch: "radial-gradient(circle at 40% 35%,#fff5dd,#c9a24a)", sprite: "🔆", laborCategory: "electrical", wastePercent: 0, basePriceEur: 89 },
  { id: "lgt-tira-led", name: "Tira LED Perfilería Empotrada", brand: "Lumen", sku: "TRA-EMP-ML", category: "lighting", subcategory: "Lineal", unit: "ml", color: "Aluminio", style: "Técnico", description: "Perfil de empotrar con difusor + tira 24 V 2700 K CRI90.", swatch: "linear-gradient(90deg,#d8dade,#fdf6d8 50%,#d8dade)", laborCategory: "electrical", wastePercent: 5, basePriceEur: 34 },
  { id: "lgt-foco-empotrable", name: "Foco Empotrable Orientable Negro", brand: "Lumen", sku: "EMP-ORI-BLK", category: "lighting", subcategory: "Downlight", unit: "ud", color: "Negro", style: "Técnico", description: "GU10 incluido, marco orientable 30°, corte 75 mm.", swatch: "radial-gradient(circle at 50% 40%,#f7f7f7,#2c2c2c 75%)", sprite: "🔦", laborCategory: "electrical", wastePercent: 0, basePriceEur: 22 },
  { id: "lgt-pie-arco", name: "Lámpara de Pie Arco Mármol", brand: "Lumen", sku: "PIE-ARC-01", category: "lighting", subcategory: "Pie", unit: "ud", color: "Acero / blanco", style: "Elegante", description: "Base de mármol, brazo de acero, pantalla orientable.", swatch: "linear-gradient(120deg,#c9ccd0,#eceef0)", sprite: "🛋️", laborCategory: "assembly", wastePercent: 0, basePriceEur: 289 },

  // ---------- COCINA / BAÑO (5) ----------
  { id: "kit-mueble-mate", name: "Frente de Cocina Mate Antracita", brand: "Cucinare", sku: "MTE-ANT-ML", category: "kitchen", subcategory: "Frente", unit: "ml", color: "Antracita", style: "Contemporáneo", description: "Módulos con frente lacado mate, herrajes de apertura push.", swatch: "linear-gradient(120deg,#33363a,#4c5055)", sprite: "🧰", laborCategory: "carpentry", wastePercent: 0, basePriceEur: 320 },
  { id: "cnt-encimera-cuarzo", name: "Encimera Cuarzo Blanco Ártico", brand: "Silstone", sku: "QTZ-ART-20", category: "kitchen", subcategory: "Encimera", unit: "ml", color: "Blanco ártico", style: "Minimalista", description: "Cuarzo técnico 20 mm, canto recto, incluye hueco de fregadero.", swatch: "linear-gradient(120deg,#eef1f2,#dde1e3)", laborCategory: "carpentry", wastePercent: 5, basePriceEur: 180 },
  { id: "app-frigo-combi", name: "Frigorífico Combi No Frost Inox", brand: "Nevor", sku: "CMB-NF-185", category: "appliance", subcategory: "Frigorífico", unit: "ud", color: "Acero inox", style: "Contemporáneo", description: "185 cm, clase C, 324 L, dispensador de agua.", swatch: "linear-gradient(120deg,#b9bec3,#d7dbde)", sprite: "🧊", laborCategory: "assembly", wastePercent: 0, basePriceEur: 749 },
  { id: "wc-suspendido", name: "Inodoro Suspendido Rimless + Cisterna", brand: "Aqora", sku: "SUS-RML-01", category: "bathroom", subcategory: "Sanitario", unit: "ud", color: "Blanco", style: "Minimalista", description: "Bastidor empotrado, tapa amortiguada, pulsador cromado.", swatch: "linear-gradient(120deg,#f2f4f5,#e0e3e5)", sprite: "🚽", laborCategory: "plumbing", wastePercent: 0, basePriceEur: 349 },
  { id: "shw-plato-pizarra", name: "Plato de Ducha Resina Efecto Pizarra", brand: "Aqora", sku: "PLT-PZR-120", category: "bathroom", subcategory: "Ducha", unit: "ud", color: "Antracita", style: "Contemporáneo", description: "Carga mineral, cortable, 120×80, sifón extraplano incluido.", swatch: "linear-gradient(120deg,#3c3f42,#565a5e)", sprite: "🚿", laborCategory: "plumbing", wastePercent: 0, basePriceEur: 279 },

  // ---------- DECORACIÓN / CONSTRUCCIÓN (5) ----------
  { id: "dec-monstera-xl", name: "Monstera Deliciosa XL + Maceta", brand: "Verdal", sku: "MON-XL-150", category: "decoration", subcategory: "Planta", unit: "ud", color: "Verde", style: "Natural", description: "Planta natural de 140-160 cm con maceta de fibra y arlita.", swatch: "radial-gradient(circle at 40% 30%,#4b8f52,#2f5e34)", sprite: "🪴", laborCategory: "general", wastePercent: 0, basePriceEur: 119 },
  { id: "dec-espejo-redondo", name: "Espejo Redondo Ø90 Marco Latón", brand: "Galería 21", sku: "RND-90-BRS", category: "decoration", subcategory: "Espejo", unit: "ud", color: "Latón", style: "Elegante", description: "Espejo biselado con marco metálico fino acabado latón mate.", swatch: "radial-gradient(circle at 50% 45%,#e9edef,#b9a15f 90%)", sprite: "🪞", laborCategory: "general", wastePercent: 0, basePriceEur: 179 },
  { id: "dec-alfombra-lana", name: "Alfombra de Lana Anudada 200×300", brand: "Tramé", sku: "LAN-200300-SND", category: "decoration", subcategory: "Textil", unit: "ud", color: "Arena", style: "Bereber", description: "Lana virgen anudada a mano, dibujo geométrico tono sobre tono.", swatch: "linear-gradient(120deg,#d8c8ad,#c2ad8b)", sprite: "🟫", laborCategory: "general", wastePercent: 0, basePriceEur: 399 },
  { id: "con-tabique-pladur", name: "Tabique de Placa de Yeso 100 mm", brand: "Sistemia", sku: "PYL-100-STD", category: "construction", subcategory: "Tabiquería", unit: "m2", color: "Gris", style: "Obra", description: "Tabique autoportante con doble placa y aislamiento de lana mineral.", swatch: "linear-gradient(120deg,#dcdcdc,#c2c2c2)", laborCategory: "masonry", wastePercent: 10, basePriceEur: 38 },
  { id: "con-falso-techo", name: "Falso Techo Continuo Registrable", brand: "Sistemia", sku: "FT-CONT-01", category: "construction", subcategory: "Techo", unit: "m2", color: "Blanco", style: "Obra", description: "Estructura oculta con placa estándar, listo para pintar.", swatch: "linear-gradient(180deg,#f6f5f2,#e6e4de)", laborCategory: "masonry", wastePercent: 8, basePriceEur: 32 },
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

/** Reference EUR price per product — the seed for market price generation. */
export const BASE_PRICE_EUR: Record<string, number> = Object.fromEntries(
  SEED.map((s) => [s.id, s.basePriceEur]),
);

export const productById = (id: string): Product | undefined =>
  CATALOG.find((p) => p.id === id);
