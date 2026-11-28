import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_STYLE_PREFS } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";
import { isUUID, SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

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

    let userId: string | null = null;
    let authError: string | null = null;

    // Try Supabase auth first to obtain genuine user UUID
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

      if (data?.user?.id && isUUID(data.user.id)) {
        userId = data.user.id;
      }
      if (error) {
        authError = error.message;
      }
    } catch (err: unknown) {
      authError = err instanceof Error ? err.message : "Auth service unavailable";
    }

    // If Supabase returned an error or did not return a user, surface the error
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Failed to create account. Please verify your details." },
        { status: 400 }
      );
    }

    // Create profile in Supabase table for the real authenticated UUID
    try {
      await supabase.from("profiles").upsert(
        {
          id: userId,
          username: cleanUsername,
          full_name: cleanName,
          avatar_url: null,
          bio: "Hey there! I am new on SnapLoop 🌱",
          created_at: new Date().toISOString(),
          style_prefs: DEFAULT_STYLE_PREFS,
        },
        { onConflict: "id" }
      );
    } catch (profileErr) {
      console.warn("[Register] Profile upsert notice:", profileErr);
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
    const isProd = process.env.NODE_ENV === "production";

    // Clear demo cookie if present
    cookieStore.delete("snaploop_demo");

    cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(newProfile), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      ok: true,
      profile: newProfile,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create account" },
      { status: 500 }
    );
  }
}
