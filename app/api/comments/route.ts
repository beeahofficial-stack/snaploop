import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, body: body.trim() })
    .select("*, profiles(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify post owner
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post && post.user_id !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: post.user_id,
      actor_id: user.id,
      type: "comment",
      post_id: postId,
      read: false,
    });
  }

  return NextResponse.json({ comment });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
