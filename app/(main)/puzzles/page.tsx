import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PuzzlesClient from "@/components/PuzzlesClient";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { getCurrentSession, isUUID } from "@/lib/auth/session";
import { Profile } from "@/lib/types";

export default async function PuzzlesPage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect("/login");
  }

  const profile = session.profile;
  let friendProfiles: Array<{
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    style_prefs: unknown;
  }> = [];

  try {
    const supabase = await createClient();
    if (session.user && isUUID(session.user.id)) {
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", session.user.id);

      const followingIds = following?.map((f) => f.following_id).filter(isUUID) ?? [];

      if (followingIds.length > 0) {
        const { data: fProfiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, style_prefs")
          .in("id", followingIds)
          .limit(10);
        friendProfiles = fProfiles ?? [];
      }
    }
  } catch {
    friendProfiles = [];
  }

  const safeProfile: Profile = {
    ...profile,
    style_prefs: normalizeStylePrefs(profile.style_prefs || DEFAULT_STYLE_PREFS),
  };

  return (
    <PuzzlesClient
      profile={safeProfile}
      friendsList={friendProfiles}
      currentUserId={profile.id}
    />
  );
}
