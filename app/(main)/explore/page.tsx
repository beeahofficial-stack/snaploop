import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExploreClient from "@/components/ExploreClient";
import { getCurrentSession, isUUID } from "@/lib/auth/session";
import { Post } from "@/lib/types";

export default async function ExplorePage() {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.profile) redirect("/login");

  const currentUserId = session.profile.id;
  let enrichedPosts: Post[] = [];

  try {
    const supabase = await createClient();
    const { data: posts } = await supabase
      .from("posts")
      .select(`*, profiles(*), likes(count), comments(count)`)
      .order("created_at", { ascending: false })
      .limit(30);

    const postIds = posts?.map((p) => p.id) ?? [];
    const { data: userLikes } = postIds.length && session.user && isUUID(session.user.id)
      ? await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", session.user.id)
          .in("post_id", postIds)
      : { data: [] };

    const likedPostIds = new Set(userLikes?.map((l: { post_id: string }) => l.post_id) ?? []);

    enrichedPosts = ((posts ?? []) as Post[]).map((p) => ({
      ...p,
      user_has_liked: likedPostIds.has(p.id),
    }));
  } catch {
    enrichedPosts = [];
  }

  return <ExploreClient initialPosts={enrichedPosts} currentUserId={currentUserId} />;
}
