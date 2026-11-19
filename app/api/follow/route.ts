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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  if (targetUserId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
    await supabase.from("notifications").insert({
      recipient_id: targetUserId,
      actor_id: user.id,
      type: "follow",
      post_id: null,
      read: false,
    });
    return NextResponse.json({ following: true });
  }
}
