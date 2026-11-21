import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedClient from "@/components/FeedClient";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { getCurrentSession, isUUID } from "@/lib/auth/session";
import { Post } from "@/lib/types";

export default async function FeedPage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect("/login");
  }

  const currentUserId = session.profile.id;
  const prefs = normalizeStylePrefs(session.profile.style_prefs || DEFAULT_STYLE_PREFS);

  let posts: Post[] = [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles(*),
        likes(count),
        comments(count)
      `
      )
      .order("created_at", { ascending: false })
      .limit(30);

    if (session.user && isUUID(session.user.id)) {
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", session.user.id);

      const followingIds = following?.map((f) => f.following_id).filter(isUUID) ?? [];
      const feedUserIds = [...followingIds, session.user.id];

      if (prefs.feedMode === "following" && feedUserIds.length > 0) {
        query = query.in("user_id", feedUserIds);
      }
    }

    const { data } = await query;
    if (data) {
      posts = data as Post[];
    }
  } catch {
    // If Supabase table queries fail, empty feed
    posts = [];
  }

  return (
    <FeedClient
      initialPosts={posts}
      currentUserId={currentUserId}
      feedMode={prefs.feedMode}
      puzzleStreak={prefs.puzzleStats?.streak ?? 0}
    />
  );
}
