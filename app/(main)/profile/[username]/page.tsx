import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import ProfileClient from "@/components/ProfileClient";
import { DEFAULT_STYLE_PREFS, normalizeStylePrefs } from "@/lib/stylePrefs";
import { getCurrentSession } from "@/lib/auth/session";
import { Post, Profile } from "@/lib/types";

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
  const session = await getCurrentSession();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cleanUsername = decodeURIComponent(username).trim();
  const cleanLower = cleanUsername.toLowerCase();

  // Determine if the profile being requested belongs to the logged-in user or active session
  const isOwnProfile =
    cleanLower === "me" ||
    (user && (
      cleanLower === (user.user_metadata?.preferred_username || "").toLowerCase() ||
      cleanLower === (user.user_metadata?.user_name || "").toLowerCase() ||
      cleanLower === (user.email?.split("@")[0] || "").toLowerCase() ||
      cleanLower === (session.profile?.username || "").toLowerCase()
    )) ||
    (session.isAuthenticated && session.profile && (
      cleanLower === session.profile.username.toLowerCase()
    )) ||
    (isDemo && cleanLower === "spooder_man");

  let profile: Profile | null = null;

  if (isDemo && cleanLower === "spooder_man") {
    profile = DEMO_PROFILE;
  } else {
    // 1. Try querying Supabase profiles table
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (error) {
        console.error("[Profile] Supabase profile lookup error:", error);
      }
      if (data) {
        profile = data as Profile;
      }
    } catch (err) {
      console.error("[Profile] Unexpected error querying profiles table:", err);
    }

    // 2. Fallback: If profile row is missing in Supabase for the authenticated user, synthesize from auth metadata!
    if (!profile && (isOwnProfile || user)) {
      const targetUsername =
        (isOwnProfile ? cleanUsername : null) ||
        session.profile?.username ||
        user?.user_metadata?.preferred_username ||
        user?.user_metadata?.user_name ||
        user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
        cleanUsername ||
        `user_${user?.id?.slice(0, 8) || "guest"}`;

      profile = {
        id: user?.id || session.profile?.id || "demo-user-id",
        username: targetUsername,
        full_name:
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          session.profile?.full_name ||
          targetUsername,
        avatar_url:
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.picture ||
          session.profile?.avatar_url ||
          null,
        bio: session.profile?.bio || "Hey there! I am using SnapLoop 🌱",
        created_at: user?.created_at || session.profile?.created_at || new Date().toISOString(),
        style_prefs: session.profile?.style_prefs || DEFAULT_STYLE_PREFS,
      };

      // In the background, auto-heal and create the missing row in public.profiles so future queries succeed
      if (user) {
        Promise.resolve(
          supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                username: targetUsername,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                created_at: profile.created_at,
                style_prefs: profile.style_prefs,
              },
              { onConflict: "id" }
            )
        )
          .then(({ error: upsertError }) => {
            if (upsertError) {
              console.warn("[Profile] Could not auto-heal missing profile row in Supabase:", upsertError.message);
            } else {
              console.log("[Profile] Auto-created missing profile row in Supabase for", targetUsername);
            }
          })
          .catch(() => {});
      }
    }
  }

  // 3. If someone navigates to a completely non-existent user and it's not the logged-in user, render a graceful Not Found card
  if (!profile) {
    return (
      <div style={styles.notFoundWrapper}>
        <div style={styles.notFoundCard}>
          <div style={styles.notFoundIcon}>🌱</div>
          <h2 style={styles.notFoundTitle}>User @{cleanUsername} not found</h2>
          <p style={styles.notFoundText}>
            This user hasn’t created an account on SnapLoop yet or may have updated their username.
          </p>
          <div style={styles.notFoundActions}>
            <Link href="/explore" style={styles.primaryBtn}>
              Explore Creators
            </Link>
            <Link href="/feed" style={styles.secondaryBtn}>
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Query posts for this profile
  let posts: Post[] = [];
  try {
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id,user_id,caption,image_url,created_at,profiles(*),likes(count),comments(count)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (!postsError && postsData) {
      posts = postsData as unknown as Post[];
    } else if (postsError) {
      console.warn("[Profile] Joined posts query failed, attempting simple select:", postsError.message);
      // Fallback simple query without profiles(*) join in case profiles row missing or join fails
      const { data: simplePosts } = await supabase
        .from("posts")
        .select("id,user_id,caption,image_url,created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (simplePosts) {
        posts = simplePosts.map((p) => ({
          ...p,
          profiles: profile!,
          likes: [{ count: 0 }],
          comments: [{ count: 0 }],
        })) as unknown as Post[];
      }
    }
  } catch (err) {
    console.error("[Profile] Error loading user posts:", err);
  }

  // 5. Query follower & following counts
  let realFollowersCount = 0;
  let realFollowingCount = 0;
  let isFollowing = false;

  try {
    const [followersRes, followingRes, followCheckRes] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      user && user.id !== profile.id
        ? supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    realFollowersCount = followersRes.count ?? 0;
    realFollowingCount = followingRes.count ?? 0;
    isFollowing = !!followCheckRes.data;
  } catch (err) {
    console.warn("[Profile] Follows query notice:", err);
  }

  const currentUserId = user?.id || session.profile?.id || (isDemo ? "demo-user-id" : "");
  const isOwner = currentUserId === profile.id || isOwnProfile;

  return (
    <ProfileClient
      profile={{ ...profile, style_prefs: normalizeStylePrefs(profile.style_prefs) }}
      posts={posts}
      followersCount={realFollowersCount}
      followingCount={realFollowingCount}
      isFollowing={isFollowing}
      isOwnProfile={isOwner}
      currentUserId={currentUserId}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  notFoundWrapper: {
    minHeight: "75vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  notFoundCard: {
    maxWidth: "420px",
    width: "100%",
    background: "#FFFFFF",
    borderRadius: "24px",
    border: "1px solid #E6E1D4",
    padding: "40px 28px",
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(44, 51, 24, 0.06)",
  },
  notFoundIcon: {
    fontSize: "44px",
    marginBottom: "16px",
  },
  notFoundTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#2C3318",
    margin: "0 0 8px",
  },
  notFoundText: {
    fontSize: "14px",
    color: "#6F7658",
    lineHeight: 1.5,
    margin: "0 0 24px",
  },
  notFoundActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "13px",
    textDecoration: "none",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "#F6F3EB",
    color: "#2C3318",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid #E6E1D4",
  },
};
