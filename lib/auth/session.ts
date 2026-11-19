import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";

export const SNAPLOOP_USER_COOKIE = "snaploop_user";
export const SNAPLOOP_DEMO_COOKIE = "snaploop_demo";

export const DEFAULT_GUEST_PROFILE: Profile = {
  id: "demo-user-id",
  username: "beeahofficial",
  full_name: "Beeah",
  bio: "Curating my aesthetic Pinterest comfort zone & daily chess streaks! 🌿✨",
  avatar_url: null,
  created_at: new Date("2026-01-01").toISOString(),
  style_prefs: DEFAULT_STYLE_PREFS,
};

export interface CurrentSession {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isDemo: boolean;
}

export async function getCurrentSession(): Promise<CurrentSession> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(SNAPLOOP_USER_COOKIE)?.value;
  const isDemo = cookieStore.get(SNAPLOOP_DEMO_COOKIE)?.value === "true";

  // 1. Check custom user cookie session first (fast & reliable)
  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie) as Profile;
      if (parsed && parsed.id && parsed.username) {
        return {
          user: { id: parsed.id, email: (parsed as { email?: string }).email },
          profile: {
            ...parsed,
            style_prefs: normalizeStylePrefs(parsed.style_prefs),
          },
          isAuthenticated: true,
          isDemo: false,
        };
      }
    } catch {
      // invalid JSON, fall through
    }
  }

  // 2. Check Supabase auth session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Try fetching profile from Supabase profiles table
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const username =
        dbProfile?.username ||
        user.user_metadata?.preferred_username ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
        `user_${user.id.slice(0, 8)}`;

      const full_name =
        dbProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        username;

      const avatar_url =
        dbProfile?.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

      const bio = dbProfile?.bio || "Hey there! I am using SnapLoop 🌱";
      const style_prefs = normalizeStylePrefs(dbProfile?.style_prefs);

      const profile: Profile = {
        id: user.id,
        username,
        full_name,
        bio,
        avatar_url,
        created_at: dbProfile?.created_at || user.created_at || new Date().toISOString(),
        style_prefs,
      };

      return {
        user: { id: user.id, email: user.email },
        profile,
        isAuthenticated: true,
        isDemo: false,
      };
    }
  } catch {
    // Supabase error, fall through to demo/guest check
  }

  // 3. Check Demo / Guest mode
  if (isDemo) {
    return {
      user: null,
      profile: DEFAULT_GUEST_PROFILE,
      isAuthenticated: true,
      isDemo: true,
    };
  }

  // 4. Not logged in
  return {
    user: null,
    profile: null,
    isAuthenticated: false,
    isDemo: false,
  };
}
