import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, readDb } from "@/lib/db/local-store";
import { projectService } from "@/lib/services/project-service";
import { itemService } from "@/lib/services/item-service";
import { estimateService } from "@/lib/services/estimate-service";
import { productById } from "@/data/catalog";

describe("changing a project's country recalculates the market", () => {
  beforeEach(() => resetDb());

  it("updates currency, tax and every item price — but not past estimates", async () => {
    const project = await projectService.create({
      name: "Test",
      clientId: null,
      countryCode: "ES",
      projectType: "living_room",
      description: "",
    });
    await itemService.add({ projectId: project.id, product: productById("flr-roble-natural")! });
    await itemService.add({ projectId: project.id, product: productById("sof-modular-3p")! });

    // freeze an estimate in EUR
    const estimateEs = await estimateService.generate(project.id);
    expect(estimateEs.currencyCode).toBe("EUR");
    const frozenTotal = estimateEs.total;

    // change country -> PY
    const updated = await projectService.changeCountry(project.id, "PY");
    expect(updated.currencyCode).toBe("PYG");
    expect(updated.taxRate).toBe(10);

    const bundle = await projectService.get(project.id);
    for (const item of bundle!.items) {
      expect(item.currencyCode).toBe("PYG");
      expect(item.unitPrice).toBeGreaterThan(0);
    }

    // the historical estimate is untouched
    const stored = await estimateService.get(estimateEs.id);
    expect(stored!.currencyCode).toBe("EUR");
    expect(stored!.total).toBe(frozenTotal);

    // a new estimate reflects the new market
    const estimatePy = await estimateService.generate(project.id);
    expect(estimatePy.currencyCode).toBe("PYG");
    expect(estimatePy.total).not.toBe(frozenTotal);
  });

  it("keeps users from reading another user's project", async () => {
    const project = await projectService.create({
      name: "Owned",
      clientId: null,
      countryCode: "ES",
      projectType: "office",
      description: "",
    });
    // tamper: reassign owner in the store, then confirm access is denied
    const db = readDb();
    db.projects.find((p) => p.id === project.id)!.userId = "someone-else";
    await expect(projectService.get(project.id)).resolves.toBeNull();
    await expect(estimateService.generate(project.id)).rejects.toThrow();
  });
});
