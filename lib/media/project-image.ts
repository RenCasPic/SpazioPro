import type { ProjectType } from "@/types";

/**
 * Editorial photography per project type — real interiors read far more premium
 * than synthetic thumbnails for a product whose pitch is *visualizing spaces*.
 * Served from the Unsplash CDN (auto-format/crop). Cards fall back to a tinted
 * gradient if an image fails to load. Swap for your own asset store later.
 */
const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const BY_TYPE: Record<ProjectType, string[]> = {
  kitchen: ["1556909114-f6e7ad7d3136", "1556912173-3bb406ef7e77", "1600489000022-c2086d79f9d4"],
  bathroom: ["1620626011761-996317b8d101", "1584622650111-993a426fbf0a", "1595515106969-1ce29566ff1c"],
  living_room: ["1586023492125-27b2c045efd7", "1567016432779-094069958ea5", "1493663284031-b7e3aefcae8e"],
  bedroom: ["1616594039964-ae9021a400a0", "1522708323590-d24dbb6b0267", "1560448204-e02f11c3d0e2"],
  office: ["1524758631624-e2822e304c36", "1497366754035-f200968a6e72", "1497366811353-6870744d04b2"],
  commercial: ["1441986300917-64674bd600d8", "1524758631624-e2822e304c36", "1497366216548-37526070297c"],
  terrace: ["1600566753086-00f18fb6b3ea", "1600585154526-990dced4db0d", "1416331108676-a22ccb276e35"],
  exterior: ["1600566753190-17f0baa2a6c3", "1580587771525-78b9dba3b914", "1512917774080-9991f1c4c750"],
  whole_home: ["1600585154340-be6161a56a0c", "1600607687939-ce8a6c25118c", "1600047509807-ba8f99d2cdde"],
  other: ["1618221195710-dd6b41faaea6", "1616137466211-f939a420be84", "1493663284031-b7e3aefcae8e"],
};

/** Deterministic pick so a project keeps the same image across renders. */
export function projectImage(type: ProjectType, seed = "", w = 1200): string {
  const pool = BY_TYPE[type] ?? BY_TYPE.other;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return U(pool[Math.abs(h) % pool.length], w);
}

export const HERO_IMAGE = U("1556912167-f556f1f39fdf", 1600);
