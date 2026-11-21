import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Comments] Could not load comments:", error);
    return NextResponse.json({ error: error.message, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Comments] Auth lookup failed:", authError);
    return NextResponse.json({ error: authError.message, message: authError.message }, { status: 401 });
  }
  if (!user) return NextResponse.json({ error: "Please sign in again to comment.", message: "Authentication required" }, { status: 401 });

  const { postId, body } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId", message: "Missing postId" }, { status: 400 });
  if (!body?.trim()) return NextResponse.json({ error: "Comment cannot be empty", message: "Comment cannot be empty" }, { status: 400 });

  // Ensure profile row exists to prevent foreign key constraint violation (comments_user_id_fkey)
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

  let commentData = null;
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, body: body.trim() })
    .select("*, profiles(*)")
    .single();

  if (!error && comment) {
    commentData = comment;
  } else {
    // Retry with simple insert if profiles(*) join failed
    const { data: simpleComment, error: simpleError } = await supabase
      .from("comments")
      .insert({ user_id: user.id, post_id: postId, body: body.trim() })
      .select("*")
      .single();

    if (!simpleError && simpleComment) {
      commentData = {
        ...simpleComment,
        profiles: {
          id: user.id,
          username: user.user_metadata?.preferred_username || user.email?.split("@")[0] || "you",
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      };
    } else {
      const finalError = error || simpleError;
      console.error("[Comments] Insert failed (check comments RLS and foreign keys):", finalError);
      return NextResponse.json({ error: finalError?.message || "Failed to post comment", message: finalError?.message || "Failed to post comment" }, { status: 500 });
    }
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (postError) {
    console.warn("[Comments] Post lookup for notification failed:", postError);
  }

  if (post && post.user_id !== user.id) {
    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: post.user_id,
      actor_id: user.id,
      type: "comment",
      post_id: postId,
      read: false,
    });
    if (notificationError) console.warn("[Comments] Notification insert failed:", notificationError);
  }

  return NextResponse.json({ comment: commentData });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Comments] Auth lookup failed:", authError);
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }
  if (!user) return NextResponse.json({ error: "Please sign in again.", message: "Authentication required" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  if (error) {
    console.error("[Comments] Delete failed:", error);
    return NextResponse.json({ error: error.message, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
