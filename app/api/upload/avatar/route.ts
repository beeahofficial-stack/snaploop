import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5MB for profile picture" }, { status: 400 });
  }

  const userId = session.profile.id;
  let avatar_url: string | null = null;

  // Try Supabase Storage
  if (session.user) {
    try {
      const supabase = await createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl + `?v=${Date.now()}`;
      }
    } catch {
      // Fall through to base64
    }
  }

  // Fallback: base64 data URL — works for all users
  if (!avatar_url) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    avatar_url = `data:${file.type};base64,${base64}`;
  }

  // Update persistent session cookie with new avatar_url
  const updatedProfile = { ...session.profile, avatar_url };
  const cookieStore = await cookies();
  cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(updatedProfile), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Also try updating Supabase profiles table
  if (session.user) {
    try {
      const supabase = await createClient();
      await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("id", session.user.id);
    } catch {
      // best effort
    }
  }

  return NextResponse.json({ ok: true, avatar_url });
}
