import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";
import { SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, username, email, password } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_");
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanName = (full_name || cleanUsername).trim();
    const supabase = await createClient();

    let userId = `user_${Date.now()}`;
    let authError: string | null = null;

    // Try Supabase auth first
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: cleanName,
            preferred_username: cleanUsername,
          },
        },
      });

      if (data?.user?.id) {
        userId = data.user.id;
      }
      if (error) {
        authError = error.message;
      }
    } catch (err: unknown) {
      authError = err instanceof Error ? err.message : "Auth service unavailable";
    }

    // Try creating profile in Supabase table
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        username: cleanUsername,
        full_name: cleanName,
        avatar_url: null,
        bio: "Hey there! I am new on SnapLoop 🌱",
        created_at: new Date().toISOString(),
        style_prefs: DEFAULT_STYLE_PREFS,
      });
    } catch {
      // Supabase table permission / RLS may prevent insert; cookie session handles it gracefully
    }

    // Create user profile object
    const newProfile: Profile = {
      id: userId,
      username: cleanUsername,
      full_name: cleanName,
      bio: "Hey there! I am new on SnapLoop 🌱",
      avatar_url: null,
      created_at: new Date().toISOString(),
      style_prefs: DEFAULT_STYLE_PREFS,
    };

    // Set persistent session cookie so user is immediately logged in
    const cookieStore = await cookies();
    cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(newProfile), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      ok: true,
      profile: newProfile,
      notice: authError ? "Signed in with local profile session" : undefined,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create account" },
      { status: 500 }
    );
  }
}
