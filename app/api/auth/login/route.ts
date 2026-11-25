import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";
import { isUUID, SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data?.user || !isUUID(data.user.id)) {
      return NextResponse.json(
        { error: "Authentication failed. No valid user ID returned." },
        { status: 401 }
      );
    }

    // Fetch or create profile in Supabase profiles table
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

    if (!dbProfile) {
      try {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            username,
            full_name,
            bio: "Hey there! I am using SnapLoop 🌱",
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            style_prefs: DEFAULT_STYLE_PREFS,
          },
          { onConflict: "id" }
        );
      } catch (upsertErr) {
        console.warn("[Login] Profile auto-creation notice:", upsertErr);
      }
    }

    const profile: Profile = {
      id: data.user.id, // Genuine Supabase Auth user UUID
      username,
      full_name,
      bio: dbProfile?.bio || "Hey there! I am using SnapLoop 🌱",
      avatar_url: dbProfile?.avatar_url || data.user.user_metadata?.avatar_url || null,
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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log in" },
      { status: 500 }
    );
  }
}
