"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/types";
import { profileService } from "@/lib/services/profile-service";
import { demoAuth } from "@/lib/auth/demo-auth";
import { isDemoMode } from "@/lib/constants";

export function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = isDemoMode() ? demoAuth.currentSession() : null;
      if (isDemoMode() && !session) setProfile(null);
      else setProfile(await profileService.get());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, refresh, isDemo: isDemoMode() };
}
