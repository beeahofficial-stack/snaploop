import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import ProfileClient from "@/components/ProfileClient";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { Profile } from "@/lib/types";

const DEMO_PROFILE: Profile = {
  id: "demo-user-id",
  username: "spooder_man",
  full_name: "Spooder Man",
  bio: "Curating my aesthetic Pinterest comfort zone & daily chess streaks! 🌿✨",
  avatar_url: null,
  created_at: new Date().toISOString(),
  style_prefs: DEFAULT_STYLE_PREFS,
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("snaploop_demo")?.value === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isDemo) redirect("/login");

  let profile: Profile | null = null;

  if (isDemo && username === "spooder_man") {
    profile = DEMO_PROFILE;
  } else {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    profile = data;
  }

  if (!profile && user) {
    const generatedUsername =
      username ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
      `user_${user.id.slice(0, 6)}`;

    const finalUsername = generatedUsername.replace(/[^a-zA-Z0-9_]/g, "_") || `user_${user.id.slice(0, 6)}`;

    await supabase.from("profiles").upsert({
      id: user.id,
      username: finalUsername,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || finalUsername,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      bio: "Hey there! I am new on SnapLoop 🌱",
      created_at: new Date().toISOString(),
      style_prefs: DEFAULT_STYLE_PREFS,
    });

    redirect(`/profile/${finalUsername}`);
  }

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select(`*, profiles(*), likes(count), comments(count)`)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const { count: realFollowersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: realFollowingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const { data: isFollowingData } = user
    ? await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle()
    : { data: null };

  const currentUserId = user?.id || (isDemo ? "demo-user-id" : "");
  const isOwn = currentUserId === profile.id;

  const safeProfile = {
    ...profile,
    style_prefs: normalizeStylePrefs(profile.style_prefs),
  };

  return (
    <ProfileClient
      profile={safeProfile}
      posts={posts ?? []}
      followersCount={realFollowersCount ?? 0}
      followingCount={realFollowingCount ?? 0}
      isFollowing={!!isFollowingData}
      isOwnProfile={isOwn}
      currentUserId={currentUserId}
    />
  );
}
