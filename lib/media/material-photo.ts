import type { ProductCategory } from "@/types";

/**
 * Product / material photography for the visual library. Served from the
 * Unsplash CDN; every card falls back to the product's own `swatch` gradient
 * if the image fails to load, so a bad id never breaks the grid. Replace with
 * a real supplier asset store when product feeds are wired in.
 */
const U = (id: string, w = 640) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;

const BY_CATEGORY: Partial<Record<ProductCategory, string[]>> = {
  // flooring
  hardwood: ["1517705008128-361805f42e86", "1600607687920-4e2a09cf159d"],
  engineered_hardwood: ["1595428774223-ef52624120d2", "1600607687920-4e2a09cf159d"],
  lvp: ["1584285405429-136bf988919c", "1615873968403-89e068629265"],
  laminate: ["1595428774223-ef52624120d2", "1517705008128-361805f42e86"],
  carpet: ["1493552152660-f915ab47ae9d", "1600166898405-da9535204843"],
  floor_tile: ["1615874959474-d609969a20ed", "1584622781564-1d987f7333c1"],
  floor_stone: ["1615529182904-14819c35db37", "1600566752355-35792bedcfea"],
  // walls
  paint: ["1589939705384-5185137a7f0f", "1562259949-e8e7689d7828"],
  drywall: ["1620121692029-d088224ddc74", "1503387762-592deb58ef4e"],
  wallpaper: ["1616627561950-9f746e330187", "1618221195710-dd6b41faaea6"],
  wall_tile: ["1584622781564-1d987f7333c1", "1615874959474-d609969a20ed"],
  wall_stone: ["1600566752355-35792bedcfea", "1615529182904-14819c35db37"],
  wood_paneling: ["1520695625556-c2a7bfe87a8e", "1517705008128-361805f42e86"],
  wainscoting: ["1600585152220-90363fe7e115", "1600566753190-17f0baa2a6c3"],
  // kitchen
  cabinets: ["1556909114-f6e7ad7d3136", "1556912173-3bb406ef7e77"],
  countertops: ["1556911220-bff31c812dba", "1600489000022-c2086d79f9d4"],
  backsplash: ["1556909114-f6e7ad7d3136", "1584622781564-1d987f7333c1"],
  kitchen_sink: ["1584622650111-993a426fbf0a", "1556911220-bff31c812dba"],
  faucet: ["1584622650111-993a426fbf0a", "1595515106969-1ce29566ff1c"],
  appliance: ["1556912173-3bb406ef7e77", "1571175443880-49e1d25b2bc5"],
  // bathroom
  vanity: ["1620626011761-996317b8d101", "1595515106969-1ce29566ff1c"],
  toilet: ["1584622650111-993a426fbf0a", "1620626011761-996317b8d101"],
  shower: ["1552321554-5fefe8c9ef14", "1595515106969-1ce29566ff1c"],
  bathtub: ["1552321554-5fefe8c9ef14", "1584622650111-993a426fbf0a"],
  bath_tile: ["1584622781564-1d987f7333c1", "1615874959474-d609969a20ed"],
  fixture: ["1584622650111-993a426fbf0a", "1552321554-5fefe8c9ef14"],
  mirror: ["1618220179428-22790b461013", "1620626011761-996317b8d101"],
  // furniture
  sofa: ["1493663284031-b7e3aefcae8e", "1555041469-a586c61ea9bc"],
  sectional: ["1567016432779-094069958ea5", "1493663284031-b7e3aefcae8e"],
  chair: ["1567538096630-e0c55bd6374c", "1519947486511-46149fa0a254"],
  table: ["1533090161767-e6ffed986c88", "1530018607912-eff2daa1bac4"],
  bed: ["1616594039964-ae9021a400a0", "1522708323590-d24dbb6b0267"],
  nightstand: ["1532372320572-cda25653a26d", "1616594039964-ae9021a400a0"],
  dresser: ["1595428774223-ef52624120d2", "1532372320572-cda25653a26d"],
  desk: ["1524758631624-e2822e304c36", "1449247709967-d4461a6a6103"],
  // lighting
  pendant: ["1524484485831-a92ffc0de03f", "1513506003901-1e6a229e2d15"],
  chandelier: ["1543198126-a4d09e1f1f8b", "1524484485831-a92ffc0de03f"],
  recessed: ["1565538810643-b5bdb714032a", "1513506003901-1e6a229e2d15"],
  wall_sconce: ["1540932239986-30128078f3c5", "1524484485831-a92ffc0de03f"],
  floor_lamp: ["1507473885765-e6ed057f782c", "1540932239986-30128078f3c5"],
  table_lamp: ["1513506003901-1e6a229e2d15", "1507003211169-0a1dd7228f2d"],
};

/** Deterministic pick so a product keeps the same photo. */
export function materialPhoto(productId: string, category: ProductCategory, w = 640): string | null {
  const pool = BY_CATEGORY[category];
  if (!pool || pool.length === 0) return null;
  let h = 0;
  for (let i = 0; i < productId.length; i++) h = (h * 31 + productId.charCodeAt(i)) | 0;
  return U(pool[Math.abs(h) % pool.length], w);
}
