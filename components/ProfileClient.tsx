"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Post, Profile } from "@/lib/types";
import PostCard from "./PostCard";
import toast from "react-hot-toast";
import {
  COMFORT_THEMES,
  COZY_PATTERNS,
  COVER_OPTIONS,
  INTEREST_OPTIONS,
  MOOD_EMOJIS,
  STICKER_CATALOG,
  StylePrefs,
  comfortThemeObj,
  coverGradient,
  cozyPatternObj,
  normalizeStylePrefs,
  ComfortPin,
} from "@/lib/stylePrefs";

export default function ProfileClient({
  profile,
  posts: initialPosts,
  followersCount: initialFollowers,
  followingCount,
  isFollowing: initialIsFollowing,
  isOwnProfile,
  currentUserId,
}: {
  profile: Profile;
  posts: Post[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  currentUserId: string;
}) {
  const [prefs, setPrefs] = useState<StylePrefs>(normalizeStylePrefs(profile.style_prefs));
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowers);
  const [editing, setEditing] = useState(false);
  const [decorating, setDecorating] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "comfort" | "puzzles">("posts");
  const [postViewMode, setPostViewMode] = useState<"grid" | "list">("grid");

  // Basic profile editing
  const [editName, setEditName] = useState(profile.full_name || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editUsername, setEditUsername] = useState(profile.username || "");
  const [editAvatar, setEditAvatar] = useState(profile.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [savingDecor, setSavingDecor] = useState(false);

  // Purge any stale local mock posts from localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem("snaploop_local_posts");
    } catch {
      // ignore
    }
  }, []);

  // New pin creation in Comfort Moodboard
  const [newPinTitle, setNewPinTitle] = useState("");
  const [newPinEmoji, setNewPinEmoji] = useState("✨");
  const [newPinNote, setNewPinNote] = useState("");
  const [showAddPinModal, setShowAddPinModal] = useState(false);

  // Followers / Following list modal
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<Array<{ id: string; username: string; full_name: string | null; avatar_url: string | null }>>([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const openFollowList = async (type: "followers" | "following") => {
    setShowFollowModal(type);
    setLoadingFollowList(true);
    try {
      const res = await fetch(`/api/follow?userId=${profile.id}&type=${type}`);
      const data = await res.json();
      setFollowList(data.users || []);
    } catch {
      setFollowList([]);
    }
    setLoadingFollowList(false);
  };

  const activeTheme = comfortThemeObj(prefs.themePreset);
  const activePattern = cozyPatternObj(prefs.cozyPattern);
  const puzzleStats = prefs.puzzleStats;

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: profile.id }),
    });
    if (!res.ok) {
      setIsFollowing(isFollowing);
      setFollowersCount(followersCount);
      const data = await res.json().catch(() => null);
      const message = data?.message || data?.error || `Follow failed (${res.status})`;
      console.error("[ProfileClient] Follow mutation failed:", { status: res.status, data });
      toast.error(message);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: editName,
        bio: editBio,
        username: editUsername,
        avatar_url: editAvatar,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Profile & PFP updated ✨");
      setEditing(false);
      if (data.profile?.username && data.profile.username !== profile.username) {
        window.location.href = `/profile/${data.profile.username}`;
      } else {
        // Refresh local state
        profile.full_name = editName;
        profile.bio = editBio;
        profile.username = editUsername;
        profile.avatar_url = editAvatar;
      }
    } else {
      toast.error(data.error || "Failed to save profile");
    }
    setSaving(false);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB for profile picture");
      return;
    }
    // Show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setEditAvatar(previewUrl);
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        setEditAvatar(data.avatar_url);
        profile.avatar_url = data.avatar_url;
        toast.success("Profile picture updated! 📸");
      } else {
        toast.error(data.error || "Failed to upload photo");
      }
    } catch {
      toast.error("Upload failed — please try again");
    }
    setUploadingAvatar(false);
  };

  const handleSaveDecor = async (updatedPrefs?: StylePrefs) => {
    const toSave = updatedPrefs || prefs;
    setSavingDecor(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ style_prefs: toSave }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Comfort Zone updated beautifully ✨");
      setDecorating(false);
      if (data.profile?.style_prefs) {
        setPrefs(normalizeStylePrefs(data.profile.style_prefs));
      }
    } else {
      toast.error(data.error || "Couldn't save decorations");
    }
    setSavingDecor(false);
  };

  const handleAddPin = async () => {
    if (!newPinTitle.trim()) {
      toast.error("Please add a title for your pin");
      return;
    }
    const newPin: ComfortPin = {
      id: `pin-${Date.now()}`,
      title: newPinTitle.trim(),
      emoji: newPinEmoji,
      note: newPinNote.trim(),
      color: activeTheme.surface,
    };
    const updated = {
      ...prefs,
      comfortPins: [newPin, ...prefs.comfortPins],
    };
    setPrefs(updated);
    setNewPinTitle("");
    setNewPinNote("");
    setShowAddPinModal(false);
    await handleSaveDecor(updated);
  };

  const handleDeletePin = async (pinId: string) => {
    const updated = {
      ...prefs,
      comfortPins: prefs.comfortPins.filter((p) => p.id !== pinId),
    };
    setPrefs(updated);
    await handleSaveDecor(updated);
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const interestChips = prefs.interests
    .map((id) => INTEREST_OPTIONS.find((i) => i.id === id))
    .filter(Boolean);

  return (
    <div
      className="snaploop-profile"
      style={{
        ...styles.page,
        backgroundImage: activePattern.cssPattern !== "none" ? activePattern.cssPattern : undefined,
        backgroundSize: activePattern.id === "grid" ? "20px 20px" : "16px 16px",
      }}
    >
      {/* Aesthetic Pinterest-Inspired Banner */}
      <div style={{ ...styles.cover, background: coverGradient(prefs.cover) }}>
        <div style={styles.coverDecorOverlay}>
          <span style={styles.themeBadge}>
            {activeTheme.emoji} {activeTheme.label}
          </span>
          {isOwnProfile && (
            <button
              onClick={() => setDecorating(true)}
              style={styles.coverEditBtn}
              title="Customize your Comfort Zone"
            >
              ✨ Decorate Space
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Comfort Card */}
      <div style={styles.headerCard}>
        {/* Top row: Avatar & Profile Stats */}
        <div style={styles.profileRow}>
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatarRing, border: `3px solid ${activeTheme.secondary}` }}>
              {editAvatar || profile.avatar_url ? (
                <img src={editAvatar || profile.avatar_url!} alt="" style={styles.avatar} />
              ) : (
                <div style={{ ...styles.avatarFb, background: activeTheme.gradient }}>
                  {(profile.full_name || profile.username || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  style={styles.avatarCameraBtn}
                  title="Choose Profile Picture from Gallery"
                >
                  📷
                </button>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  style={{ display: "none" }}
                />
              </>
            )}
            {prefs.showMood && (
              <span style={styles.avatarMoodFloat} title="Current Mood">
                {prefs.moodEmoji}
              </span>
            )}
          </div>

          <div style={styles.statsCol}>
            <div style={styles.usernameRow}>
              <h1 style={styles.username}>@{profile.username}</h1>
            </div>
            <div style={styles.stats}>
              <div style={styles.stat}>
                <b>{posts.length}</b>
                <span>posts</span>
              </div>
              <button
                type="button"
                onClick={() => openFollowList("followers")}
                style={styles.statBtn}
                title="View followers"
              >
                <b>{followersCount}</b>
                <span>followers</span>
              </button>
              <button
                type="button"
                onClick={() => openFollowList("following")}
                style={styles.statBtn}
                title="View following"
              >
                <b>{followingCount}</b>
                <span>following</span>
              </button>
            </div>
          </div>
        </div>

        {/* Name, Bio, and Mood Status */}
        <div style={styles.bioBlock}>
          <div style={styles.nameRow}>
            <span style={styles.displayName}>{profile.full_name || profile.username}</span>
            {prefs.comfortStatus && (
              <span style={{ ...styles.comfortStatusPill, background: activeTheme.surface, border: `1px solid ${activeTheme.secondary}` }}>
                {prefs.comfortStatus}
              </span>
            )}
          </div>

          {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

          {/* Cozy Quote Quote-Block */}
          {prefs.comfortQuote && (
            <div style={{ ...styles.quoteCard, background: activeTheme.surface, borderLeftColor: activeTheme.primary }}>
              <span style={styles.quoteIcon}>“</span>
              <p style={styles.quoteText}>{prefs.comfortQuote}</p>
            </div>
          )}

          {/* Aesthetic Stickers / Badges */}
          {prefs.stickers.length > 0 && (
            <div style={styles.stickersRow}>
              {prefs.stickers.map((stk) => (
                <span key={stk} style={styles.stickerChip}>
                  {stk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={styles.actions}>
          {isOwnProfile ? (
            <>
              <button onClick={() => setEditing(true)} style={styles.primaryBtn}>
                Edit profile
              </button>
              <button
                onClick={() => setDecorating(true)}
                style={{ ...styles.secondaryBtn, color: activeTheme.primary }}
              >
                🎨 Decorate Comfort Zone
              </button>
              <Link href="/settings" style={styles.settingsBtn} title="Settings">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </>
          ) : (
            <button
              onClick={handleFollow}
              style={isFollowing ? styles.secondaryBtn : styles.followBtn}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Pinterest-style Interest Highlights */}
        {(interestChips.length > 0 || isOwnProfile) && (
          <div style={styles.highlights}>
            {interestChips.map((item) => (
              <div key={item!.id} style={styles.highlight}>
                <div style={{ ...styles.highlightCircle, border: `2px solid ${activeTheme.secondary}` }}>
                  {item!.emoji}
                </div>
                <span style={styles.highlightLabel}>{item!.label}</span>
              </div>
            ))}
            {isOwnProfile && (
              <button
                onClick={() => setDecorating(true)}
                style={styles.highlight}
                title="Add highlights"
              >
                <div style={styles.highlightAdd}>+</div>
                <span style={styles.highlightLabel}>Add</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comfort Zone Navigation Tabs: Snaps vs Pinterest Moodboard vs Puzzle Streaks */}
      <div className="profile-tabs" style={styles.tabsBar}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            ...styles.navTab,
            ...(activeTab === "posts" ? { ...styles.navTabActive, border: `1px solid ${activeTheme.primary}`, color: activeTheme.primary } : {}),
          }}
        >
          📷 Snaps ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("comfort")}
          style={{
            ...styles.navTab,
            ...(activeTab === "comfort" ? { ...styles.navTabActive, border: `1px solid ${activeTheme.primary}`, color: activeTheme.primary } : {}),
          }}
        >
          📌 Comfort Moodboard ({prefs.comfortPins.length})
        </button>
        <button
          onClick={() => setActiveTab("puzzles")}
          style={{
            ...styles.navTab,
            ...(activeTab === "puzzles" ? { ...styles.navTabActive, border: `1px solid ${activeTheme.primary}`, color: activeTheme.primary } : {}),
          }}
        >
          🧩 Puzzle Streaks (🔥{puzzleStats.streak})
        </button>
      </div>

      {/* TAB 1: POSTS / SNAPS */}
      {activeTab === "posts" && (
        <div style={styles.tabContent}>
          <div style={styles.viewToggleRow}>
            <span style={styles.viewLabel}>View layout:</span>
            <div style={styles.viewPill}>
              <button
                onClick={() => setPostViewMode("grid")}
                style={{
                  ...styles.viewBtn,
                  ...(postViewMode === "grid" ? styles.viewBtnActive : {}),
                }}
              >
                ▦ Grid
              </button>
              <button
                onClick={() => setPostViewMode("list")}
                style={{
                  ...styles.viewBtn,
                  ...(postViewMode === "list" ? styles.viewBtnActive : {}),
                }}
              >
                ☰ Feed
              </button>
            </div>
          </div>

          {posts.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2C3318", margin: "0 0 6px" }}>No posts yet</h3>
              <p style={{ color: "#6F7658", fontSize: "13px", margin: "0 0 16px" }}>
                {isOwnProfile
                  ? "Share your first photo or thought from the Home feed!"
                  : `@${profile.username} hasn't posted any snaps yet.`}
              </p>
              {isOwnProfile && (
                <Link
                  href="/feed"
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
                    color: "#FFFFFF",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "13px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(95,133,32,0.2)",
                  }}
                >
                  Share a Snap 🌱
                </Link>
              )}
            </div>
          ) : postViewMode === "grid" ? (
            <div className="profile-post-grid" style={styles.grid}>
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  style={styles.gridCell}
                  onClick={() => setPostViewMode("list")}
                  title="View post"
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={styles.gridImg} />
                  ) : (
                    <div style={styles.gridText}>{post.caption?.slice(0, 45) || "Photo"}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.list}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PINTEREST COMFORT MOODBOARD */}
      {activeTab === "comfort" && (
        <div style={styles.tabContent}>
          <div style={styles.moodboardHeader}>
            <div>
              <h3 style={styles.moodboardTitle}>Aesthetic Comfort Sanctuary</h3>
              <p style={styles.moodboardSubtitle}>
                A personalized moodboard of peaceful moments, quotes, and memories.
              </p>
            </div>
            {isOwnProfile && (
              <button onClick={() => setShowAddPinModal(true)} style={styles.addPinBtn}>
                + Add Mood Pin
              </button>
            )}
          </div>

          <div style={styles.pinsGrid}>
            {prefs.comfortPins.map((pin) => (
              <div
                key={pin.id}
                style={{
                  ...styles.pinCard,
                  background: pin.color || "#FFFFFF",
                }}
              >
                <div style={styles.pinTop}>
                  <span style={styles.pinEmoji}>{pin.emoji || "✨"}</span>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeletePin(pin.id)}
                      style={styles.pinDeleteBtn}
                      title="Remove pin"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <h4 style={styles.pinTitle}>{pin.title}</h4>
                {pin.note && <p style={styles.pinNote}>{pin.note}</p>}
                <div style={styles.pinFooter}>
                  <span style={styles.pinTag}>#comfortzone</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHESS.COM PUZZLE STREAK STATS */}
      {activeTab === "puzzles" && (
        <div style={styles.tabContent}>
          <div style={styles.puzzleProfileCard}>
            <div style={styles.puzzleCardHeader}>
              <div style={styles.puzzleTrophyIcon}>🏆</div>
              <div>
                <h3 style={styles.puzzleProfileTitle}>Daily Puzzle Streak Mastery</h3>
                <p style={styles.puzzleProfileSub}>
                  Inspired by Chess.com tactics • Solve daily to grow your streak!
                </p>
              </div>
            </div>

            <div style={styles.puzzleStatsGrid}>
              <div style={styles.puzzleStatBox}>
                <span style={styles.puzzleStatVal}>🔥 {puzzleStats.streak}</span>
                <span style={styles.puzzleStatLbl}>Current Streak</span>
              </div>
              <div style={styles.puzzleStatBox}>
                <span style={styles.puzzleStatVal}>⚡ {puzzleStats.bestStreak}</span>
                <span style={styles.puzzleStatLbl}>Best Streak</span>
              </div>
              <div style={styles.puzzleStatBox}>
                <span style={styles.puzzleStatVal}>♟️ {puzzleStats.rating}</span>
                <span style={styles.puzzleStatLbl}>Tactic Rating</span>
              </div>
              <div style={styles.puzzleStatBox}>
                <span style={styles.puzzleStatVal}>🎯 {puzzleStats.totalSolved}</span>
                <span style={styles.puzzleStatLbl}>Total Solved</span>
              </div>
            </div>

            <div style={styles.puzzleActionRow}>
              <Link href="/puzzles" style={styles.playDailyBtn}>
                Play Today’s Puzzle Arena →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Mood Pin Modal */}
      {showAddPinModal && (
        <div style={styles.overlay} onClick={() => setShowAddPinModal(false)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHead}>
              <h3 style={styles.sheetTitle}>📌 Add Comfort Pin</h3>
              <button onClick={() => setShowAddPinModal(false)} style={styles.close}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.label}>
                Pin Title
                <input
                  value={newPinTitle}
                  onChange={(e) => setNewPinTitle(e.target.value)}
                  placeholder="e.g. Lavender Tea & Poetry"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Emoji Icon
                <div style={styles.emojiPickerRow}>
                  {["🍵", "🌿", "🍓", "☕", "🕯️", "🎧", "📖", "🌙", "✨", "🧸", "🥐"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewPinEmoji(em)}
                      style={{
                        ...styles.emojiPickBtn,
                        ...(newPinEmoji === em ? styles.emojiPickBtnActive : {}),
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </label>
              <label style={styles.label}>
                Cozy Note / Memory
                <textarea
                  value={newPinNote}
                  onChange={(e) => setNewPinNote(e.target.value)}
                  rows={3}
                  placeholder="Write a sweet memory or cozy thought…"
                  style={{ ...styles.input, resize: "vertical" }}
                />
              </label>
              <button onClick={handleAddPin} style={styles.saveBtn}>
                Save Pin to Comfort Zone ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Basics Modal */}
      {editing && (
        <div style={styles.overlay} onClick={() => setEditing(false)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHead}>
              <div>
                <h2 style={styles.sheetTitle}>Edit Profile & PFP</h2>
                <p style={styles.sheetSub}>Update your photo, display name, bio, and handle</p>
              </div>
              <button onClick={() => setEditing(false)} style={styles.close}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {/* Profile Picture (PFP) Selector */}
              <div style={styles.pfpEditSection}>
                <label style={styles.fieldTitle}>Profile Picture (PFP)</label>
                <div style={styles.pfpPreviewRow}>
                  <div style={styles.pfpLargePreview}>
                    {editAvatar ? (
                      <img src={editAvatar} alt="" style={styles.pfpImg} />
                    ) : (
                      <div style={styles.pfpFallback}>
                        {(editName || editUsername || "?")[0].toUpperCase()}
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div style={styles.pfpUploading}>Uploading…</div>
                    )}
                  </div>
                  <div style={styles.pfpInputCol}>
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      style={styles.uploadPhotoBtn}
                      disabled={uploadingAvatar}
                    >
                      📷 {uploadingAvatar ? "Uploading…" : "Choose from Gallery"}
                    </button>
                    <input
                      ref={avatarFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      style={{ display: "none" }}
                    />
                    <span style={styles.pfpHelpText}>Or paste a URL:</span>
                    <input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://..."
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Preset Avatars */}
                <div style={styles.presetAvatarsRow}>
                  {[
                    { label: "🌸 Cute Pastel", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces" },
                    { label: "🌿 Nature Boy", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces" },
                    { label: "🎧 Lofi Girl", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces" },
                    { label: "🍵 Chill Guy", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces" },
                    { label: "✨ Aesthetic", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces" },
                    { label: "🐱 Cozy Kitty", url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=150&h=150&fit=crop&crop=faces" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setEditAvatar(preset.url)}
                      style={{
                        ...styles.presetAvatarBtn,
                        border: editAvatar === preset.url ? "2.5px solid #5F8520" : "1.5px solid #E6E1D4",
                      }}
                      title={preset.label}
                    >
                      <img src={preset.url} alt="" style={styles.presetAvatarImg} />
                    </button>
                  ))}
                </div>
                {editAvatar && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar("")}
                    style={styles.removePfpBtn}
                  >
                    Remove Profile Picture
                  </button>
                )}
              </div>

              <label style={styles.label}>
                Display Name
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Username
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Bio
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell your cute story, favorite aesthetics, or coffee thoughts…"
                  style={{ ...styles.input, resize: "vertical" }}
                />
              </label>

              <button onClick={handleSaveProfile} disabled={saving} style={styles.saveBtn}>
                {saving ? "Saving Profile…" : "Save Profile Changes ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Pinterest Comfort Decorator Modal */}
      {decorating && (
        <div style={styles.overlay} onClick={() => setDecorating(false)}>
          <div style={{ ...styles.modalSheet, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHead}>
              <div>
                <h2 style={styles.sheetTitle}>✨ Decorate Comfort Zone</h2>
                <p style={styles.sheetSub}>Personalize your profile into your aesthetic sanctuary</p>
              </div>
              <button onClick={() => setDecorating(false)} style={styles.close}>
                ✕
              </button>
            </div>

            <div style={styles.decorScrollBody}>
              {/* Theme Palette */}
              <div style={styles.decorSection}>
                <h4 style={styles.sectionHeader}>🎨 Aesthetic Theme Presets</h4>
                <div style={styles.themeGrid}>
                  {COMFORT_THEMES.map((theme) => {
                    const isSelected = prefs.themePreset === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, themePreset: theme.id }))}
                        style={{
                          ...styles.themeCard,
                          border: isSelected ? `1.5px solid ${theme.primary}` : "1.5px solid #E6E1D4",
                          background: isSelected ? theme.surface : "#FFFFFF",
                          boxShadow: isSelected ? `0 4px 14px ${theme.secondary}44` : "none",
                        }}
                      >
                        <span style={styles.themeEmoji}>{theme.emoji}</span>
                        <div>
                          <div style={{ ...styles.themeName, color: theme.primary }}>{theme.label}</div>
                          <div style={styles.themeBlurb}>{theme.blurb}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Texture Pattern */}
              <div style={styles.decorSection}>
                <h4 style={styles.sectionHeader}>📜 Cozy Background Texture</h4>
                <div style={styles.patternRow}>
                  {COZY_PATTERNS.map((pat) => {
                    const isSelected = prefs.cozyPattern === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, cozyPattern: pat.id }))}
                        style={{
                          ...styles.patternBtn,
                          border: isSelected ? "1px solid #5F8520" : "1px solid #E6E1D4",
                          background: isSelected ? "rgba(168, 214, 58, 0.18)" : "#FFFFFF",
                        }}
                      >
                        <span>{pat.emoji}</span>
                        <span>{pat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Gradient */}
              <div style={styles.decorSection}>
                <h4 style={styles.sectionHeader}>🌄 Cover Header Gradient</h4>
                <div style={styles.swatchRow}>
                  {COVER_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() => setPrefs((p) => ({ ...p, cover: c.id }))}
                      style={{
                        ...styles.swatch,
                        background: c.gradient,
                        outline: prefs.cover === c.id ? "3px solid #5F8520" : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Cozy Quote & Status */}
              <div style={styles.decorSection}>
                <h4 style={styles.sectionHeader}>💭 Cozy Quote & Status</h4>
                <label style={styles.label}>
                  Current Cozy Status
                  <input
                    value={prefs.comfortStatus}
                    onChange={(e) => setPrefs((p) => ({ ...p, comfortStatus: e.target.value }))}
                    placeholder="e.g. Sipping warm matcha 🍵"
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Comfort Zone Quote
                  <textarea
                    value={prefs.comfortQuote}
                    onChange={(e) => setPrefs((p) => ({ ...p, comfortQuote: e.target.value }))}
                    rows={2}
                    placeholder="A comforting quote or favorite gentle thought…"
                    style={{ ...styles.input, resize: "vertical" }}
                  />
                </label>
              </div>

              {/* Mood Sticker */}
              <div style={styles.decorSection}>
                <div style={styles.flexBetween}>
                  <h4 style={styles.sectionHeader}>🌿 Floating Mood Sticker</h4>
                  <label style={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={prefs.showMood}
                      onChange={(e) => setPrefs((p) => ({ ...p, showMood: e.target.checked }))}
                    />
                    <span>Show on avatar</span>
                  </label>
                </div>
                <div style={styles.emojiPickerRow}>
                  {MOOD_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setPrefs((p) => ({ ...p, moodEmoji: emoji }))}
                      style={{
                        ...styles.emojiPickBtn,
                        ...(prefs.moodEmoji === emoji ? styles.emojiPickBtnActive : {}),
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collectible Sticker Badges */}
              <div style={styles.decorSection}>
                <h4 style={styles.sectionHeader}>🏷️ Aesthetic Badges (Pick up to 4)</h4>
                <div style={styles.stickerPickGrid}>
                  {STICKER_CATALOG.map((stk) => {
                    const isSelected = prefs.stickers.includes(stk);
                    return (
                      <button
                        key={stk}
                        type="button"
                        onClick={() => {
                          setPrefs((p) => {
                            if (isSelected) {
                              return { ...p, stickers: p.stickers.filter((s) => s !== stk) };
                            }
                            if (p.stickers.length >= 4) {
                              toast("Pick up to 4 badges ✨");
                              return p;
                            }
                            return { ...p, stickers: [...p.stickers, stk] };
                          });
                        }}
                        style={{
                          ...styles.stickerPickBtn,
                          ...(isSelected ? styles.stickerPickBtnActive : {}),
                        }}
                      >
                        {stk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => handleSaveDecor()}
                disabled={savingDecor}
                style={styles.saveBtn}
              >
                {savingDecor ? "Saving Sanctuary…" : "Save Comfort Zone ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Followers / Following List Modal */}
      {showFollowModal && (
        <div style={styles.overlay} onClick={() => setShowFollowModal(null)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHead}>
              <h3 style={styles.sheetTitle}>
                {showFollowModal === "followers" ? "Followers" : "Following"}
              </h3>
              <button onClick={() => setShowFollowModal(null)} style={styles.close}>
                ✕
              </button>
            </div>
            <div style={styles.followModalBody}>
              {loadingFollowList ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#6F7658" }}>Loading…</div>
              ) : followList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 16px", color: "#6F7658" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#2C3318", marginBottom: 4 }}>
                    {showFollowModal === "followers" ? "No followers yet" : "Not following anyone yet"}
                  </p>
                  <p style={{ fontSize: 12, color: "#8E9675" }}>
                    When people connect with this profile, they will appear here.
                  </p>
                </div>
              ) : (
                followList.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={() => setShowFollowModal(null)}
                    style={styles.followUserRow}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={styles.followAvatar} />
                    ) : (
                      <div style={styles.followAvatarFb}>
                        {(u.full_name || u.username || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.followName}>{u.full_name || u.username}</div>
                      <div style={styles.followUser}>@{u.username}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "0 0 40px",
    minHeight: "100vh",
    transition: "background 0.3s ease",
  },
  cover: {
    height: 180,
    position: "relative",
    borderRadius: "0 0 28px 28px",
    boxShadow: "0 6px 24px rgba(44, 51, 24, 0.08)",
  },
  coverDecorOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
    left: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeBadge: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    color: "#2C3318",
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "999px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  coverEditBtn: {
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    color: "#2C3318",
    fontSize: "13px",
    fontWeight: "700",
    padding: "7px 14px",
    borderRadius: "999px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.6)",
  },
  headerCard: {
    background: "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(16px)",
    margin: "-50px 16px 20px",
    borderRadius: "28px",
    padding: "24px 22px 20px",
    border: "1px solid #E6E1D4",
    boxShadow: "0 12px 36px rgba(44, 51, 24, 0.06)",
    position: "relative",
    zIndex: 10,
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: "50%",
    padding: "3px",
    border: "3px solid #A8D63A",
    display: "grid",
    placeItems: "center",
    background: "#FFFFFF",
    boxShadow: "0 4px 16px rgba(44, 51, 24, 0.12)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarFb: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    color: "#FFFFFF",
    fontSize: "30px",
    fontWeight: "800",
  },
  avatarMoodFloat: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    fontSize: "16px",
    border: "2px solid #E6E1D4",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  avatarCameraBtn: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    fontSize: "14px",
    border: "2px solid #E6E1D4",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    cursor: "pointer",
  },
  pfpEditSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  pfpPreviewRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  pfpLargePreview: {
    position: "relative" as const,
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #A8D63A",
    flexShrink: 0,
  },
  pfpImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  pfpFallback: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    display: "grid",
    placeItems: "center",
    color: "#FFFFFF",
    fontSize: "22px",
    fontWeight: "bold",
  },
  pfpInputCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  pfpHelpText: {
    fontSize: "11px",
    color: "#8E9675",
    fontWeight: "600",
    marginTop: "4px",
  },
  uploadPhotoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #EAF6C6, #D8EFAE)",
    border: "1.5px solid #B5DE4E",
    borderRadius: "12px",
    color: "#2C3318",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  pfpUploading: {
    position: "absolute" as const,
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.75)",
    borderRadius: "50%",
    fontSize: "11px",
    fontWeight: "700",
    color: "#5F8520",
  },
  removePfpBtn: {
    marginTop: "8px",
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #E6E1D4",
    borderRadius: "10px",
    color: "#9C4040",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  presetAvatarsRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  presetAvatarBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    padding: "2px",
    background: "#FFFFFF",
    cursor: "pointer",
    flexShrink: 0,
    overflow: "hidden",
  },
  presetAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  statsCol: {
    flex: 1,
  },
  usernameRow: {
    marginBottom: "8px",
  },
  username: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#2C3318",
    letterSpacing: "-0.03em",
  },
  stats: {
    display: "flex",
    gap: "24px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    color: "#6F7658",
    fontSize: "12px",
  },
  statBtn: {
    display: "flex",
    flexDirection: "column",
    color: "#6F7658",
    fontSize: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },
  followModalBody: {
    padding: "16px 20px",
    maxHeight: "60vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  followUserRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "14px",
    background: "#FAF9F4",
    border: "1px solid #EFECE3",
    textDecoration: "none",
    color: "inherit",
    transition: "background 0.15s ease",
  },
  followAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  followAvatarFb: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "bold",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  followName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2C3318",
  },
  followUser: {
    fontSize: "11px",
    color: "#8E9675",
  },
  bioBlock: {
    marginTop: "16px",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  displayName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2C3318",
  },
  comfortStatusPill: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#4A5E1E",
    padding: "3px 10px",
    borderRadius: "999px",
    border: "1px solid #D8E5BE",
  },
  bio: {
    fontSize: "14px",
    color: "#555E40",
    lineHeight: 1.45,
    margin: "4px 0 10px",
  },
  quoteCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "14px",
    borderLeftWidth: "4px",
    borderLeftStyle: "solid",
    margin: "10px 0",
  },
  quoteIcon: {
    fontSize: "20px",
    color: "#5F8520",
    fontWeight: "bold",
  },
  quoteText: {
    fontSize: "13px",
    fontStyle: "italic",
    color: "#3F4A24",
    margin: 0,
  },
  stickersRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  stickerChip: {
    fontSize: "11px",
    fontWeight: "700",
    background: "rgba(246, 243, 235, 0.9)",
    color: "#5A6642",
    border: "1px solid #E2DEC8",
    padding: "4px 10px",
    borderRadius: "8px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },
  primaryBtn: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: "14px",
    background: "#2C3318",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "13px",
    border: "none",
    cursor: "pointer",
  },
  secondaryBtn: {
    flex: 1.4,
    padding: "9px 16px",
    borderRadius: "14px",
    background: "rgba(168, 214, 58, 0.16)",
    color: "#456117",
    fontWeight: "700",
    fontSize: "13px",
    border: "1px solid rgba(118, 154, 40, 0.28)",
    cursor: "pointer",
    textAlign: "center",
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: "14px",
    background: "rgba(246, 243, 235, 0.8)",
    border: "1px solid #E6E1D4",
    display: "grid",
    placeItems: "center",
    color: "#6F7658",
    textDecoration: "none",
  },
  followBtn: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "13px",
    border: "none",
    cursor: "pointer",
  },
  highlights: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    paddingTop: "16px",
    marginTop: "16px",
    borderTop: "1px solid #EFECE3",
    scrollbarWidth: "none",
  },
  highlight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  highlightCircle: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "2px solid #A8D63A",
    background: "rgba(255,255,255,0.9)",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
  },
  highlightAdd: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "2px dashed #B8C29D",
    background: "rgba(246, 243, 235, 0.6)",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    color: "#6F7658",
  },
  highlightLabel: {
    fontSize: "11px",
    color: "#6F7658",
    fontWeight: "600",
  },
  tabsBar: {
    display: "flex",
    justifyContent: "space-around",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    margin: "0 16px 18px",
    borderRadius: "16px",
    padding: "4px",
    border: "1px solid #E6E1D4",
  },
  navTab: {
    flex: 1,
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6F7658",
    background: "transparent",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
  },
  navTabActive: {
    background: "#FFFFFF",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  tabContent: {
    padding: "0 16px",
  },
  viewToggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    padding: "0 4px",
  },
  viewLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#838B6B",
  },
  viewPill: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "10px",
    border: "1px solid #E6E1D4",
    padding: "2px",
  },
  viewBtn: {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6F7658",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  viewBtnActive: {
    background: "#E8F0D0",
    color: "#2C3318",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  gridCell: {
    aspectRatio: "1",
    background: "#F2EFE6",
    borderRadius: "16px",
    overflow: "hidden",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  gridImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  gridText: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    padding: "10px",
    fontSize: "12px",
    color: "#6F7658",
    textAlign: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    background: "rgba(255,255,255,0.7)",
    borderRadius: "20px",
    border: "1px dashed #D6DEC2",
  },
  moodboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "0 4px",
  },
  moodboardTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
  },
  moodboardSubtitle: {
    fontSize: "12px",
    color: "#6F7658",
    margin: "2px 0 0",
  },
  addPinBtn: {
    padding: "8px 14px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "12px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(107, 154, 35, 0.2)",
  },
  pinsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "14px",
  },
  pinCard: {
    padding: "16px",
    borderRadius: "20px",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 6px 18px rgba(44, 51, 24, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    transition: "transform 0.2s ease",
  },
  pinTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinEmoji: {
    fontSize: "26px",
  },
  pinDeleteBtn: {
    background: "transparent",
    border: "none",
    color: "#A2A88F",
    fontSize: "14px",
    cursor: "pointer",
  },
  pinTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2C3318",
    margin: 0,
  },
  pinNote: {
    fontSize: "12px",
    color: "#5B6647",
    lineHeight: 1.4,
    margin: 0,
    flex: 1,
  },
  pinFooter: {
    marginTop: "6px",
  },
  pinTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#7E8C64",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  puzzleProfileCard: {
    background: "rgba(255, 255, 255, 0.94)",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid #E6E1D4",
    boxShadow: "0 8px 24px rgba(44, 51, 24, 0.06)",
  },
  puzzleCardHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "20px",
  },
  puzzleTrophyIcon: {
    width: 48,
    height: 48,
    borderRadius: "16px",
    background: "linear-gradient(135deg, #FFE4A0, #F7C34D)",
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
    boxShadow: "0 4px 14px rgba(247, 195, 77, 0.3)",
  },
  puzzleProfileTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
  },
  puzzleProfileSub: {
    fontSize: "12px",
    color: "#6F7658",
    margin: "3px 0 0",
  },
  puzzleStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  puzzleStatBox: {
    background: "#F8F6EE",
    padding: "16px",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    border: "1px solid #E8E5D8",
  },
  puzzleStatVal: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#2C3318",
  },
  puzzleStatLbl: {
    fontSize: "11px",
    color: "#6F7658",
    fontWeight: "600",
  },
  puzzleActionRow: {
    display: "flex",
    justifyContent: "center",
  },
  playDailyBtn: {
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "14px",
    padding: "12px 24px",
    borderRadius: "16px",
    textDecoration: "none",
    boxShadow: "0 6px 18px rgba(95, 133, 32, 0.25)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(35, 42, 20, 0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "16px",
  },
  modalSheet: {
    background: "#FFFFFF",
    borderRadius: "24px",
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
  },
  sheetHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid #EFECE3",
  },
  sheetTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
  },
  sheetSub: {
    fontSize: "12px",
    color: "#6F7658",
    margin: "2px 0 0",
  },
  close: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#8E9675",
    cursor: "pointer",
  },
  modalBody: {
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    overflowY: "auto",
  },
  decorScrollBody: {
    padding: "18px 22px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  decorSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionHeader: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2C3318",
    margin: 0,
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  themeCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    border: "1.5px solid #E6E1D4",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  themeEmoji: {
    fontSize: "22px",
  },
  themeName: {
    fontSize: "12px",
    fontWeight: "700",
  },
  themeBlurb: {
    fontSize: "10px",
    color: "#82896C",
  },
  patternRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  patternBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    borderRadius: "12px",
    border: "1px solid #E6E1D4",
    fontSize: "12px",
    fontWeight: "600",
    color: "#2C3318",
    cursor: "pointer",
  },
  swatchRow: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#46502B",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #D6DBC2",
    fontSize: "14px",
    background: "#F9F8F4",
    color: "#2C3318",
  },
  emojiPickerRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  emojiPickBtn: {
    width: 38,
    height: 38,
    borderRadius: "10px",
    border: "1px solid #E6E1D4",
    background: "#F9F8F4",
    fontSize: "18px",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  emojiPickBtnActive: {
    border: "2px solid #5F8520",
    background: "rgba(168, 214, 58, 0.2)",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#6F7658",
    cursor: "pointer",
  },
  stickerPickGrid: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  stickerPickBtn: {
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid #E6E1D4",
    background: "#F9F8F4",
    color: "#6F7658",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  stickerPickBtnActive: {
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    border: "1px solid #5F8520",
    color: "#FFFFFF",
    fontWeight: "700",
  },
  saveBtn: {
    padding: "13px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(95, 133, 32, 0.25)",
    marginTop: "6px",
  },
};
