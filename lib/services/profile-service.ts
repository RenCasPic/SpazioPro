import type { Profile } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { createProfile } from "@/lib/db/factories";
import { getCurrentUserId, getSession } from "@/lib/auth/auth";
import { countryService } from "@/lib/market/country-service";

export const profileService = {
  async get(): Promise<Profile> {
    const userId = await getCurrentUserId();
    const session = await getSession();
    const existing = readDb().profile;
    if (existing && existing.id === userId) return existing;
    // create a blank profile for a freshly-registered account
    return mutateDb((db) => {
      db.profile = createProfile(userId, session?.email ?? "");
      return db.profile;
    });
  },

  async update(patch: Partial<Profile>): Promise<Profile> {
    const userId = await getCurrentUserId();
    return mutateDb((db) => {
      if (!db.profile || db.profile.id !== userId) {
        db.profile = createProfile(userId, patch.email ?? "");
      }
      Object.assign(db.profile, patch, { updatedAt: new Date().toISOString() });
      if (patch.countryCode) {
        const c = countryService.get(patch.countryCode);
        if (c) {
          db.profile.currencyCode = c.currencyCode;
          db.profile.locale = c.locale;
          db.profile.defaultTaxRate = c.defaultTaxRate;
        }
      }
      return db.profile;
    });
  },

  async completeOnboarding(patch: Partial<Profile>): Promise<Profile> {
    return this.update({ ...patch, onboardingComplete: true });
  },
};
