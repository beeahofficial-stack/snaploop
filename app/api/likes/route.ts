import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function apiError(action: string, error: unknown, status = 500) {
  const detail = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message)
    : String(error ?? "Unknown Supabase error");
  console.error(`[Likes] ${action}:`, error);
  return NextResponse.json({ error: detail, message: detail }, { status });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return apiError("Auth session lookup failed", authError, 401);
  if (!user) return NextResponse.json({ error: "Please sign in again to like posts.", message: "Authentication required" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId", message: "Missing postId" }, { status: 400 });

  const { data: existing, error: lookupError } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (lookupError) return apiError("Could not check existing like", lookupError);

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("id", existing.id);
    if (error) return apiError("Could not remove like", error);
    return NextResponse.json({ liked: false });
  }

  // Ensure profile row exists to prevent foreign key constraint violation (likes_user_id_fkey)
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

  const { error: insertError } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  if (insertError) return apiError("Could not add like (check posts/likes RLS and foreign keys)", insertError);

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (postError) {
    console.warn("[Likes] Post lookup for notification failed:", postError);
  }

  if (post && post.user_id !== user.id) {
    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: post.user_id,
      actor_id: user.id,
      type: "like",
      post_id: postId,
      read: false,
    });
    if (notificationError) console.warn("[Likes] Notification insert failed:", notificationError);
  }

  return NextResponse.json({ liked: true });
}
