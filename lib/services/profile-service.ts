import type { Profile } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { createProfile } from "@/lib/db/factories";
import { getCurrentUserId, getSession } from "@/lib/auth/auth";

export const profileService = {
  async get(): Promise<Profile> {
    const userId = await getCurrentUserId();
    const session = await getSession();
    const existing = readDb().profile;
    if (existing && existing.id === userId) return existing;
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
      return db.profile;
    });
  },

  async completeOnboarding(patch: Partial<Profile>): Promise<Profile> {
    return this.update({ ...patch, onboardingComplete: true });
  },
};
