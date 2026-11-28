import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";

export const SNAPLOOP_USER_COOKIE = "snaploop_user";
export const SNAPLOOP_DEMO_COOKIE = "snaploop_demo";

export function isUUID(str: unknown): str is string {
  if (typeof str !== "string" || !str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const DEMO_GUEST_UUID = "e0e0e0e0-e0e0-40e0-80e0-e0e0e0e0e0e0";

export const DEFAULT_GUEST_PROFILE: Profile = {
  id: DEMO_GUEST_UUID,
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

  // 1. Check Supabase auth session (primary source of truth)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user && isUUID(user.id)) {
      // Try fetching profile from Supabase profiles table
      let dbProfile: Profile | null = null;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        dbProfile = data as Profile | null;
      } catch {
        // Table or RLS error, proceed with auth metadata fallback
      }

      // Check if user had an existing cookie profile to preserve style_prefs or bio
      let existingCookieProfile: Profile | null = null;
      if (userCookie) {
        try {
          const parsed = JSON.parse(userCookie) as Profile;
          if (isUUID(parsed.id)) {
            existingCookieProfile = parsed;
          }
        } catch {
          // ignore
        }
      }

      const username =
        dbProfile?.username ||
        existingCookieProfile?.username ||
        user.user_metadata?.preferred_username ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
        `user_${user.id.slice(0, 8)}`;

      const full_name =
        dbProfile?.full_name ||
        existingCookieProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        username;

      const avatar_url =
        dbProfile?.avatar_url ||
        existingCookieProfile?.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

      const bio = dbProfile?.bio || existingCookieProfile?.bio || "Hey there! I am using SnapLoop 🌱";
      const style_prefs = normalizeStylePrefs(dbProfile?.style_prefs || existingCookieProfile?.style_prefs);

      const profile: Profile = {
        id: user.id, // Genuine authenticated Supabase UUID
        username,
        full_name,
        bio,
        avatar_url,
        created_at: dbProfile?.created_at || user.created_at || new Date().toISOString(),
        style_prefs,
      };

      // Auto-heal cookie so any old non-UUID "user_..." in the cookie is replaced by user.id
      try {
        cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(profile), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      } catch {
        // May fail in read-only server component render; ignore
      }

      return {
        user: { id: user.id, email: user.email },
        profile,
        isAuthenticated: true,
        isDemo: false,
      };
    }
  } catch (err) {
    console.warn("[Session] Supabase auth check notice:", err);
  }

  // 2. Check user cookie session (if Supabase getUser didn't find session yet)
  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie) as Profile & { email?: string };
      if (parsed && isUUID(parsed.id) && parsed.username) {
        return {
          user: { id: parsed.id, email: parsed.email },
          profile: {
            ...parsed,
            style_prefs: normalizeStylePrefs(parsed.style_prefs),
          },
          isAuthenticated: true,
          isDemo: false,
        };
      } else {
        try {
          cookieStore.delete(SNAPLOOP_USER_COOKIE);
        } catch {
          // ignore
        }
      }
    } catch {
      try {
        cookieStore.delete(SNAPLOOP_USER_COOKIE);
      } catch {
        // ignore
      }
    }
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
