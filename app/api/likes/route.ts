import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });

    // Get post owner for notification
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (post && post.user_id !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: post.user_id,
        actor_id: user.id,
        type: "like",
        post_id: postId,
        read: false,
      });
    }

    return NextResponse.json({ liked: true });
  }
}
