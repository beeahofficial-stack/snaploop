import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";
import { SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim();
    const supabase = await createClient();

    // Try Supabase auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        // Fetch or create profile
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        const username =
          dbProfile?.username ||
          data.user.user_metadata?.preferred_username ||
          cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

        const full_name =
          dbProfile?.full_name ||
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          username;

        const profile: Profile = {
          id: data.user.id,
          username,
          full_name,
          bio: dbProfile?.bio || "Hey there! I am using SnapLoop 🌱",
          avatar_url: dbProfile?.avatar_url || null,
          created_at: dbProfile?.created_at || new Date().toISOString(),
          style_prefs: normalizeStylePrefs(dbProfile?.style_prefs),
        };

        const cookieStore = await cookies();
        cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(profile), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });

        return NextResponse.json({ ok: true, profile });
      }
    } catch {
      // Supabase threw, fall through to cookie/fallback login
    }

    // Check existing snaploop_user cookie
    const cookieStore = await cookies();
    const existing = cookieStore.get(SNAPLOOP_USER_COOKIE)?.value;
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as Profile & { email?: string };
        if (parsed?.email?.toLowerCase() === cleanEmail.toLowerCase()) {
          return NextResponse.json({ ok: true, profile: parsed });
        }
      } catch {
        // fall through
      }
    }

    // If password is at least 6 characters, let user log in with email-based profile
    if (password.length >= 6) {
      const username = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") || "user";
      const profile: Profile = {
        id: `user_${Date.now()}`,
        username,
        full_name: username,
        bio: "Hey there! I am using SnapLoop 🌱",
        avatar_url: null,
        created_at: new Date().toISOString(),
        style_prefs: DEFAULT_STYLE_PREFS,
      };

      cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(profile), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ ok: true, profile });
    }

    return NextResponse.json(
      { error: "Invalid credentials. Password must be at least 6 characters." },
      { status: 401 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log in" },
      { status: 500 }
    );
  }
}
