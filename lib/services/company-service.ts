import type { CompanyLaborRate, CompanyProductPrice, LaborCategory } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { uid } from "@/lib/utils";

/**
 * Company pricing / labor overrides — resolved BEFORE the state/national
 * defaults in lib/market (see pricing-service.resolve / labor-rate-service.rate).
 * In demo mode a "company" is just the current user; the shape is ready for
 * a real multi-user company later without changing the override contract.
 */
export const companyService = {
  async productPrices(): Promise<CompanyProductPrice[]> {
    const companyId = await getCurrentUserId();
    return readDb().companyProductPrices.filter((p) => p.companyId === companyId);
  },

  async laborRates(): Promise<CompanyLaborRate[]> {
    const companyId = await getCurrentUserId();
    return readDb().companyLaborRates.filter((r) => r.companyId === companyId);
  },

  async setProductPrice(
    productId: string,
    price: number,
    stateCode: string | null = null,
  ): Promise<CompanyProductPrice> {
    const companyId = await getCurrentUserId();
    const now = new Date().toISOString();
    return mutateDb((db) => {
      const existing = db.companyProductPrices.find(
        (p) => p.companyId === companyId && p.productId === productId && p.stateCode === stateCode,
      );
      if (existing) {
        existing.price = price;
        existing.updatedAt = now;
        return existing;
      }
      const row: CompanyProductPrice = { id: uid("cpp"), companyId, productId, stateCode, price, updatedAt: now };
      db.companyProductPrices.push(row);
      return row;
    });
  },

  async removeProductPrice(id: string): Promise<void> {
    mutateDb((db) => {
      db.companyProductPrices = db.companyProductPrices.filter((p) => p.id !== id);
    });
  },

  async setLaborRate(
    category: LaborCategory,
    cost: number,
    stateCode: string | null = null,
  ): Promise<CompanyLaborRate> {
    const companyId = await getCurrentUserId();
    const now = new Date().toISOString();
    return mutateDb((db) => {
      const existing = db.companyLaborRates.find(
        (r) => r.companyId === companyId && r.category === category && r.stateCode === stateCode,
      );
      if (existing) {
        existing.cost = cost;
        existing.updatedAt = now;
        return existing;
      }
      const row: CompanyLaborRate = { id: uid("clr"), companyId, category, stateCode, cost, updatedAt: now };
      db.companyLaborRates.push(row);
      return row;
    });
  },

  async removeLaborRate(id: string): Promise<void> {
    mutateDb((db) => {
      db.companyLaborRates = db.companyLaborRates.filter((r) => r.id !== id);
    });
  },
};
