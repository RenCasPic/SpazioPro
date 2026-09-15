import { describe, expect, it } from "vitest";
import { expandAssembly, isAssemblyWellFormed } from "@/lib/calculations/assemblies";
import { ASSEMBLIES, assemblyById } from "@/data/assemblies";
import { productById } from "@/data/catalog";

describe("assembly catalog", () => {
  it("every assembly is well-formed (accessories resolve to a real product)", () => {
    for (const assembly of ASSEMBLIES) {
      expect(isAssemblyWellFormed(assembly)).toBe(true);
      for (const c of assembly.components) {
        if (c.role === "accessory") expect(productById(c.productId as string)).toBeDefined();
      }
    }
  });

  it("every assembly has exactly one primary slot", () => {
    for (const assembly of ASSEMBLIES) {
      expect(assembly.components.filter((c) => c.role === "primary")).toHaveLength(1);
    }
  });
});

describe("expandAssembly — LVP flooring", () => {
  const assembly = assemblyById("asm-lvp-flooring")!;

  it("250 sq ft floor → material + underlayment 1:1, transitions at 1/12", () => {
    const lines = expandAssembly({ assembly, baseQuantity: 250, primaryProductId: "flr-lvp-coastal" });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({ productId: "flr-lvp-coastal", role: "primary", quantity: 250 });
    expect(lines[1]).toEqual({ productId: "sup-underlayment", role: "accessory", quantity: 250 });
    expect(lines[2].productId).toBe("sup-transition-strip");
    expect(lines[2].quantity).toBeCloseTo(20.83, 1);
  });

  it("zero or negative base quantity expands to nothing", () => {
    expect(expandAssembly({ assembly, baseQuantity: 0, primaryProductId: "flr-lvp-coastal" })).toEqual([]);
    expect(expandAssembly({ assembly, baseQuantity: -10, primaryProductId: "flr-lvp-coastal" })).toEqual([]);
  });
});

describe("expandAssembly — tile floor", () => {
  it("84 sq ft → tile, thinset and grout all at 1:1", () => {
    const assembly = assemblyById("asm-tile-floor")!;
    const lines = expandAssembly({ assembly, baseQuantity: 84, primaryProductId: "flr-porcelain-stone" });
    expect(lines.map((l) => l.quantity)).toEqual([84, 84, 84]);
    expect(lines.map((l) => l.productId)).toEqual(["flr-porcelain-stone", "sup-thinset", "sup-grout"]);
  });
});

describe("expandAssembly — interior paint (area → gallons)", () => {
  it("700 sq ft of wall = 2 gallons, matching the ~350 sq ft/gal assumption used elsewhere", () => {
    const assembly = assemblyById("asm-interior-paint")!;
    const lines = expandAssembly({ assembly, baseQuantity: 700, primaryProductId: "wal-paint-eggshell" });
    expect(lines).toEqual([{ productId: "wal-paint-eggshell", role: "primary", quantity: 2 }]);
  });
});
