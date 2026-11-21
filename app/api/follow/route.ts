import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type"); // "followers" | "following"

  if (!userId) return NextResponse.json({ users: [] });

  if (type === "followers") {
    const { data: follows } = await supabase
      .from("follows")
      .select("follower:profiles!follower_id(id, username, full_name, avatar_url)")
      .eq("following_id", userId);

    const users = (follows ?? [])
      .map((f: unknown) => (f as { follower?: unknown })?.follower)
      .filter(Boolean);
    return NextResponse.json({ users });
  } else {
    const { data: follows } = await supabase
      .from("follows")
      .select("following:profiles!following_id(id, username, full_name, avatar_url)")
      .eq("follower_id", userId);

    const users = (follows ?? [])
      .map((f: unknown) => (f as { following?: unknown })?.following)
      .filter(Boolean);
    return NextResponse.json({ users });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Follow] Auth lookup failed:", authError);
    return NextResponse.json({ error: authError.message, message: authError.message }, { status: 401 });
  }
  if (!user) return NextResponse.json({ error: "Please sign in again to follow users.", message: "Authentication required" }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId", message: "Missing targetUserId" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "Cannot follow yourself", message: "Cannot follow yourself" }, { status: 400 });

  const { data: existing, error: lookupError } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (lookupError) {
    console.error("[Follow] Existing follow lookup failed:", lookupError);
    return NextResponse.json({ error: lookupError.message, message: lookupError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase.from("follows").delete().eq("id", existing.id).eq("follower_id", user.id);
    if (error) {
      console.error("[Follow] Unfollow failed:", error);
      return NextResponse.json({ error: error.message, message: `Could not unfollow: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ following: false });
  }

  // Ensure follower profile row exists to prevent foreign key constraint violation (follows_follower_id_fkey)
  try {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        username:
          user.user_metadata?.preferred_username ||
          user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
          `user_${user.id.slice(0, 8)}`,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        bio: "Hey there! I am using SnapLoop 🌱",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch {
    // ignore
  }

  const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
  if (error) {
    console.error("[Follow] Insert failed (check follows RLS and foreign keys):", error);
    return NextResponse.json({ error: error.message, message: `Could not follow: ${error.message}` }, { status: 500 });
  }

  const { error: notificationError } = await supabase.from("notifications").insert({
    recipient_id: targetUserId,
    actor_id: user.id,
    type: "follow",
    post_id: null,
    read: false,
  });
  if (notificationError) console.warn("[Follow] Notification insert failed:", notificationError);

  return NextResponse.json({ following: true });
}
