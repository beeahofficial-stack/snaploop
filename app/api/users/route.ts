import { createClient } from "@/lib/supabase/server";
import { normalizeStylePrefs } from "@/lib/stylePrefs";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSession, isUUID, SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) return NextResponse.json({ users: [] });

  try {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, style_prefs")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10);

    return NextResponse.json({ users: users ?? [] });
  } catch {
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { full_name, bio, username, avatar_url, style_prefs } = body;

  const currentProfile = session.profile;

  const updatedProfile = {
    ...currentProfile,
    ...(full_name !== undefined ? { full_name } : {}),
    ...(bio !== undefined ? { bio } : {}),
    ...(username !== undefined ? { username: username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_") } : {}),
    ...(avatar_url !== undefined ? { avatar_url } : {}),
    ...(style_prefs !== undefined ? { style_prefs: normalizeStylePrefs(style_prefs) } : {}),
  };

  // Always update the persistent session cookie
  const cookieStore = await cookies();
  cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(updatedProfile), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Also attempt Supabase update if we have a logged-in Supabase user with valid UUID
  if (session.user && isUUID(session.user.id)) {
    try {
      const supabase = await createClient();
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (bio !== undefined) updates.bio = bio;
      if (username !== undefined) updates.username = updatedProfile.username;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (style_prefs !== undefined) updates.style_prefs = normalizeStylePrefs(style_prefs);

      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id);
    } catch {
      // Supabase permission/network issue won't block the user's settings update
    }
  }

  return NextResponse.json({
    ok: true,
    profile: updatedProfile,
  });
}
