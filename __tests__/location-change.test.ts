import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, readDb } from "@/lib/db/local-store";
import { projectService } from "@/lib/services/project-service";
import { itemService } from "@/lib/services/item-service";
import { estimateService } from "@/lib/services/estimate-service";
import { productById } from "@/data/catalog";

describe("changing a project's location recalculates the market", () => {
  beforeEach(() => resetDb());

  it("updates state, sales tax and every item price — but not past estimates", async () => {
    const project = await projectService.create({
      name: "Test Kitchen",
      clientId: null,
      projectType: "kitchen",
      description: "",
      address: "1 Test St",
      city: "Portland",
      stateCode: "OR", // no sales tax
      zipCode: "97201",
      estimateLanguage: "en-US",
    });
    await itemService.add({ projectId: project.id, product: productById("flr-porcelain-stone")! });
    await itemService.add({ projectId: project.id, product: productById("kit-quartz-counter")! });

    const first = await estimateService.generate(project.id);
    expect(first.stateCode).toBe("OR");
    expect(first.salesTaxRate).toBe(0);
    const frozenTotal = first.total;

    const updated = await projectService.changeLocation(project.id, {
      address: "1 Test St",
      city: "Chicago",
      stateCode: "IL",
      zipCode: "60601",
    });
    expect(updated.stateCode).toBe("IL");

    const bundle = await projectService.get(project.id);
    expect(bundle!.config.settings.salesTaxRate).toBe(10.25); // Chicago
    for (const item of bundle!.items) expect(item.unitPrice).toBeGreaterThan(0);

    // historical estimate untouched
    const stored = await estimateService.get(first.id);
    expect(stored!.stateCode).toBe("OR");
    expect(stored!.total).toBe(frozenTotal);

    // new estimate reflects the new market (and now has sales tax)
    const second = await estimateService.generate(project.id);
    expect(second.stateCode).toBe("IL");
    expect(second.salesTaxRate).toBe(10.25);
    expect(second.taxAmount).toBeGreaterThan(0);
  });

  it("prevents reading another user's project", async () => {
    const project = await projectService.create({
      name: "Owned",
      clientId: null,
      projectType: "bathroom",
      description: "",
      city: "Austin",
      stateCode: "TX",
      zipCode: "78701",
      estimateLanguage: "en-US",
    });
    readDb().projects.find((p) => p.id === project.id)!.userId = "someone-else";
    await expect(projectService.get(project.id)).resolves.toBeNull();
    await expect(estimateService.generate(project.id)).rejects.toThrow();
  });
});
