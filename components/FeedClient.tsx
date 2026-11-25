"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import { FeedMode } from "@/lib/stylePrefs";
import toast from "react-hot-toast";

export interface StoryItem {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  name: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

const DEFAULT_SAMPLE_STORIES: StoryItem[] = [
  {
    id: "sample_story_1",
    userId: "nature_vibes",
    username: "nature_vibes",
    name: "Nature Vibes 🌿",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop",
    caption: "Morning sunlight through the trees 🌱☀️",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "sample_story_2",
    userId: "cozy_matcha",
    username: "cozy_matcha",
    name: "Matcha Club 🍵",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop",
    caption: "Freshly whisked matcha in my comfort zone ✨",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sample_story_3",
    userId: "chess_tactics",
    username: "chess_tactics",
    name: "Chess Tactics ♟️",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    imageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop",
    caption: "Solved today’s daily puzzle in 2 moves! 🔥",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export default function FeedClient({
  initialPosts,
  currentUserId,
  feedMode = "balanced",
  puzzleStreak = 0,
}: {
  initialPosts: Post[];
  currentUserId: string;
  feedMode?: FeedMode;
  puzzleStreak?: number;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeFilter, setActiveFilter] = useState("All");

  const feedFilters = [
    { id: "All", label: "For You 🌿" },
    { id: "Following", label: "Friends 💛" },
    { id: "Cozy", label: "Cozy Vibe ☕" },
    { id: "Aesthetic", label: "Aesthetic ✨" },
  ];

  // Stories State
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // Load local stories & posts from localStorage on mount
  useEffect(() => {
    try {
      const savedStories = localStorage.getItem("snaploop_stories");
      if (savedStories) {
        const parsed = JSON.parse(savedStories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStories(parsed);
        } else {
          setStories(DEFAULT_SAMPLE_STORIES);
        }
      } else {
        setStories(DEFAULT_SAMPLE_STORIES);
      }

      // Purge any stale local mock posts from localStorage
      try {
        localStorage.removeItem("snaploop_local_posts");
      } catch {
        // ignore
      }
    } catch {
      setStories(DEFAULT_SAMPLE_STORIES);
    }
  }, []);

  // Save stories to localStorage when updated
  const saveStories = (newStories: StoryItem[]) => {
    setStories(newStories);
    try {
      localStorage.setItem("snaploop_stories", JSON.stringify(newStories));
    } catch {
      // storage error
    }
  };

  const handleCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Check if current user has an active story
  const myStories = useMemo(
    () => stories.filter((s) => s.userId === currentUserId),
    [stories, currentUserId]
  );

  const friendsStories = useMemo(
    () => stories.filter((s) => s.userId !== currentUserId),
    [stories, currentUserId]
  );

  // File pick for story
  const handleStoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB image for story");
      return;
    }
    setStoryFile(f);
    setStoryPreview(URL.createObjectURL(f));
    setIsAddingStory(true);
  };

  const handleShareStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyPreview && !storyFile) {
      toast.error("Please pick a photo from gallery");
      return;
    }
    setUploadingStory(true);

    let finalImageUrl = storyPreview || "";

    if (storyFile) {
      try {
        const reader = new FileReader();
        finalImageUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(storyFile);
        });
      } catch {
        finalImageUrl = storyPreview || "";
      }
    }

    const newStory: StoryItem = {
      id: `story_${Date.now()}`,
      userId: currentUserId,
      username: "You",
      name: "Your Story",
      avatarUrl: null,
      imageUrl: finalImageUrl,
      caption: storyCaption.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newStory, ...stories];
    saveStories(updated);
    toast.success("Story posted! ✨", { icon: "🌱" });

    setStoryFile(null);
    setStoryPreview(null);
    setStoryCaption("");
    setIsAddingStory(false);
    setUploadingStory(false);

    // Open viewer to see your new story immediately
    setActiveStoryIndex(0);
  };

  // Filter posts based on active chip
  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") return posts;
    if (activeFilter === "Following") {
      return posts.filter((p) => p.user_id !== currentUserId);
    }
    if (activeFilter === "Cozy") {
      return posts.filter((p) => {
        const text = (p.caption || "").toLowerCase();
        return (
          text.includes("cozy") ||
          text.includes("coffee") ||
          text.includes("tea") ||
          text.includes("peace") ||
          text.includes("warm")
        );
      });
    }
    if (activeFilter === "Aesthetic") {
      return posts.filter((p) => !!p.image_url);
    }
    return posts;
  }, [posts, activeFilter, currentUserId]);

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="snaploop-feed" style={styles.page}>
      {/* Industry-standard Top Navigation Bar */}
      <header className="feed-topbar" style={styles.topBar}>
        <div style={styles.brandRow}>
          <span style={styles.brand}>SnapLoop</span>
          <span style={styles.brandSprout}>🌱</span>
        </div>

        <div style={styles.topActions}>
          {/* Daily Puzzle Streak pill */}
          <Link href="/puzzles" style={styles.streakPill} title="Play Daily Chess Puzzle">
            <span style={styles.streakFire}>🔥</span>
            <span style={styles.streakText}>{puzzleStreak > 0 ? puzzleStreak : "0"}</span>
            <span style={styles.streakCount}>Streak</span>
          </Link>

          <Link href="/explore" style={styles.iconBtn} title="Explore & Search">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Stories Rail */}
      <div style={styles.storiesContainer}>
        <div style={styles.storiesRail}>
          {/* Your Story button */}
          <div
            onClick={() => {
              if (myStories.length > 0) {
                const idx = stories.findIndex((s) => s.userId === currentUserId);
                setActiveStoryIndex(idx >= 0 ? idx : 0);
              } else {
                storyFileInputRef.current?.click();
              }
            }}
            style={styles.myStoryItem}
            title={myStories.length > 0 ? "View your story" : "Add photo to your story"}
          >
            <div
              style={{
                ...styles.myStoryCircle,
                border: myStories.length > 0 ? "2.5px solid #73A824" : "2px dashed #B8C2A0",
                boxShadow: myStories.length > 0 ? "0 0 0 2px #EAF6C6" : "none",
              }}
            >
              <div style={styles.myStoryInner}>
                {myStories.length > 0 && myStories[0].imageUrl ? (
                  <img src={myStories[0].imageUrl} alt="story" style={styles.storyAvatar} />
                ) : (
                  <span style={styles.myStoryEmoji}>✨</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  storyFileInputRef.current?.click();
                }}
                style={styles.plusBadge}
                title="Add new story from gallery"
              >
                +
              </button>
            </div>
            <span style={styles.storyLabel}>Your story</span>
          </div>

          {/* Hidden input to pick story image directly from gallery/files */}
          <input
            ref={storyFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleStoryFile}
            style={{ display: "none" }}
          />

          {/* Friends' stories */}
          {friendsStories.map((story) => {
            const indexInAll = stories.findIndex((s) => s.id === story.id);
            return (
              <div
                key={story.id}
                onClick={() => setActiveStoryIndex(indexInAll)}
                style={styles.storyItem}
                title={`Watch ${story.name}'s story`}
              >
                <div style={styles.storyRing}>
                  {story.avatarUrl || story.imageUrl ? (
                    <img src={story.avatarUrl || story.imageUrl} alt="" style={styles.storyAvatar} />
                  ) : (
                    <div style={styles.storyFallback}>{(story.name || story.username)[0]?.toUpperCase()}</div>
                  )}
                </div>
                <span style={styles.storyLabel}>{story.username}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chess.com-style Social Puzzle Streaks Teaser Widget */}
      <div style={styles.puzzleTeaserWrap}>
        <Link href="/puzzles" style={styles.puzzleTeaserCard}>
          <div style={styles.puzzleIconBadge}>🧩</div>
          <div style={styles.puzzleTeaserContent}>
            <div style={styles.puzzleTeaserTitleRow}>
              <span style={styles.puzzleTeaserTitle}>Daily Chess Puzzle</span>
              <span style={styles.puzzleStreakBadge}>
                🔥 {puzzleStreak > 0 ? `${puzzleStreak} Day Streak` : "Start Streak!"}
              </span>
            </div>
            <p style={styles.puzzleTeaserDesc}>
              White to play • Find the mate in 2! Solve today to protect your streak.
            </p>
          </div>
          <span style={styles.puzzlePlayArrow}>→</span>
        </Link>
      </div>

      {/* Social Feed Mood Filter Tabs */}
      <div className="feed-filter-row" style={styles.filterRow}>
        {feedFilters.map((item) => {
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveFilter(item.id)}
              style={{
                ...styles.filterChip,
                ...(isActive ? styles.filterChipActive : {}),
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main Social Feed Composer */}
      <div className="snaploop-composer" style={styles.composer}>
        <CreatePost onCreated={handleCreated} />
      </div>

      {/* Social Feed Posts */}
      <div style={styles.feed}>
        {filteredPosts.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📸</div>
            <h3 style={styles.emptyTitle}>No posts in this feed yet</h3>
            <p style={styles.emptyText}>
              Share a photo from your gallery or explore creators in{" "}
              <Link href="/explore" style={styles.link}>
                Explore
              </Link>{" "}
              to fill your Home feed!
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Hidden feedMode anchor for algorithms */}
      <span style={{ display: "none" }}>{feedMode}</span>

      {/* STORY COMPOSER MODAL */}
      {isAddingStory && (
        <div style={styles.modalOverlay} onClick={() => setIsAddingStory(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>✨ Share to Your Story</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingStory(false);
                  setStoryFile(null);
                  setStoryPreview(null);
                  setStoryCaption("");
                }}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShareStory} style={styles.storyForm}>
              {storyPreview ? (
                <div style={styles.storyPreviewWrap}>
                  <img src={storyPreview} alt="Story preview" style={styles.storyPreviewImg} />
                  <button
                    type="button"
                    onClick={() => storyFileInputRef.current?.click()}
                    style={styles.changePhotoBtn}
                  >
                    🔄 Change photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => storyFileInputRef.current?.click()}
                  style={styles.storyUploadBox}
                >
                  <span style={{ fontSize: 36 }}>🖼️</span>
                  <span style={styles.uploadPrompt}>Tap to choose photo from gallery</span>
                  <span style={styles.uploadSub}>JPEG, PNG, WEBP up to 10MB</span>
                </div>
              )}

              <input
                type="text"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                placeholder="Add a cute caption or mood… (optional)"
                style={styles.storyCaptionInput}
                maxLength={100}
              />

              <div style={styles.storyActionsRow}>
                <button
                  type="button"
                  onClick={() => storyFileInputRef.current?.click()}
                  style={styles.galleryPickBtn}
                >
                  📷 Gallery
                </button>
                <button
                  type="submit"
                  disabled={uploadingStory || !storyPreview}
                  style={{
                    ...styles.storyShareBtn,
                    opacity: uploadingStory || !storyPreview ? 0.6 : 1,
                  }}
                >
                  {uploadingStory ? "Posting story…" : "Share Story ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTAGRAM-STYLE STORY VIEWER MODAL */}
      {activeStory !== null && (
        <div style={styles.storyViewerOverlay} onClick={() => setActiveStoryIndex(null)}>
          <div style={styles.storyViewerCard} onClick={(e) => e.stopPropagation()}>
            {/* Top Progress Bar */}
            <div style={styles.storyProgressWrap}>
              <div style={styles.storyProgressBar} />
            </div>

            {/* Story Header */}
            <div style={styles.storyViewerHeader}>
              <div style={styles.storyAuthorRow}>
                <div style={styles.storyAuthorAvatar}>
                  {activeStory.avatarUrl || activeStory.imageUrl ? (
                    <img src={activeStory.avatarUrl || activeStory.imageUrl} alt="" style={styles.authorImg} />
                  ) : (
                    <div style={styles.authorFb}>{(activeStory.name || activeStory.username)[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <div style={styles.storyAuthorName}>{activeStory.name || activeStory.username}</div>
                  <div style={styles.storyTime}>Just now • Story</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => storyFileInputRef.current?.click()}
                  style={styles.storyAddMoreBtn}
                  title="Add your own story"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStoryIndex(null)}
                  style={styles.storyCloseBtn}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Story Media */}
            <div style={styles.storyImageWrap}>
              <img src={activeStory.imageUrl} alt="Story" style={styles.storyFullImg} />
            </div>

            {/* Story Caption */}
            {activeStory.caption && (
              <div style={styles.storyCaptionPill}>
                <span>{activeStory.caption}</span>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={styles.storyNavRow}>
              <button
                type="button"
                disabled={activeStoryIndex === 0}
                onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : null))}
                style={{
                  ...styles.storyNavBtn,
                  opacity: activeStoryIndex === 0 ? 0.3 : 1,
                }}
              >
                ‹ Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
                    setActiveStoryIndex(activeStoryIndex + 1);
                  } else {
                    setActiveStoryIndex(null);
                  }
                }}
                style={styles.storyNavBtn}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 580,
    margin: "0 auto",
    padding: "0 0 32px",
    minHeight: "100%",
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px 12px",
    background: "rgba(246, 243, 235, 0.94)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid #E6E1D4",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  brand: {
    fontSize: 22,
    fontWeight: 800,
    color: "#2C3318",
    letterSpacing: "-0.04em",
  },
  brandSprout: {
    fontSize: 18,
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  streakPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #FFF9EB, #FBF3DC)",
    border: "1px solid #E8D5A3",
    padding: "6px 12px",
    borderRadius: "999px",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(184, 122, 30, 0.08)",
  },
  streakFire: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#A05A00",
  },
  streakCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#8A6D3B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #E4E0D7",
    color: "#46502B",
    textDecoration: "none",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  storiesContainer: {
    padding: "16px 0 10px",
    overflow: "hidden",
  },
  storiesRail: {
    display: "flex",
    gap: "14px",
    overflowX: "auto",
    padding: "0 20px",
    scrollbarWidth: "none",
  },
  myStoryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    flexShrink: 0,
  },
  myStoryCircle: {
    position: "relative",
    width: 62,
    height: 62,
    borderRadius: "50%",
    padding: 2,
    display: "grid",
    placeItems: "center",
    background: "#FFFFFF",
    transition: "transform 0.15s ease",
  },
  myStoryInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #EEF8D3, #D6EEA2)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  myStoryEmoji: {
    fontSize: 22,
  },
  plusBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    border: "2px solid #FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  storyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    textDecoration: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: "50%",
    padding: 3,
    background: "linear-gradient(135deg, #A8D63A, #6B9A23, #436B10)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 3px 10px rgba(95, 133, 32, 0.2)",
  },
  storyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #FFFFFF",
  },
  storyFallback: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#F2F0E6",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#5D664F",
    border: "2px solid #FFFFFF",
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5D664F",
    maxWidth: 62,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  puzzleTeaserWrap: {
    padding: "0 16px 14px",
  },
  puzzleTeaserCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "linear-gradient(135deg, #FFFFFF, #FBF8EE)",
    border: "1.5px solid #E8E2D2",
    borderRadius: "20px",
    padding: "12px 16px",
    textDecoration: "none",
    boxShadow: "0 6px 20px rgba(70, 80, 40, 0.05)",
  },
  puzzleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: "14px",
    background: "linear-gradient(135deg, #EBF5CD, #D9EFA5)",
    border: "1px solid #CDE692",
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  puzzleTeaserContent: {
    flex: 1,
    minWidth: 0,
  },
  puzzleTeaserTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "2px",
  },
  puzzleTeaserTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2C3318",
  },
  puzzleStreakBadge: {
    fontSize: 11,
    fontWeight: "700",
    background: "#FFF2D6",
    border: "1px solid #F0D59A",
    color: "#9C5700",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  puzzleTeaserDesc: {
    margin: 0,
    fontSize: 12,
    color: "#6F7658",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  puzzlePlayArrow: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5F8520",
    marginLeft: "4px",
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    padding: "4px 16px 14px",
    scrollbarWidth: "none",
  },
  filterChip: {
    border: "1px solid #E4E0D7",
    background: "rgba(255, 255, 255, 0.75)",
    color: "#5D664F",
    borderRadius: "999px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  filterChipActive: {
    background: "linear-gradient(135deg, #E2F3BE, #C7ED9C)",
    border: "1px solid #B4DE7C",
    color: "#243010",
    boxShadow: "0 4px 12px rgba(118, 154, 40, 0.16)",
  },
  composer: {
    padding: "0 16px 16px",
  },
  feed: {
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  empty: {
    textAlign: "center",
    padding: "48px 24px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "24px",
    border: "1px dashed #D6DEC2",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2C3318",
    marginBottom: "6px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#6F7658",
    lineHeight: 1.5,
  },
  link: {
    color: "#5F8520",
    fontWeight: "700",
    textDecoration: "underline",
  },

  /* STORY MODAL STYLES */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(20, 24, 12, 0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    background: "#FFFFFF",
    borderRadius: 24,
    border: "1px solid #E6E1D4",
    padding: "20px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#2C3318",
  },
  modalCloseBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#6F7658",
    cursor: "pointer",
  },
  storyForm: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  storyPreviewWrap: {
    position: "relative",
    width: "100%",
    height: "260px",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#000000",
  },
  storyPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  changePhotoBtn: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.65)",
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  storyUploadBox: {
    width: "100%",
    height: "200px",
    borderRadius: "18px",
    border: "2px dashed #B8C2A0",
    background: "#FAF9F5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },
  uploadPrompt: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#46502B",
  },
  uploadSub: {
    fontSize: "11px",
    color: "#8E9675",
  },
  storyCaptionInput: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1.5px solid #E6E1D4",
    background: "#FAF9F5",
    fontSize: "13px",
    color: "#2C3318",
    outline: "none",
    boxSizing: "border-box",
  },
  storyActionsRow: {
    display: "flex",
    gap: "10px",
  },
  galleryPickBtn: {
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1.5px solid #E6E1D4",
    background: "#F6F3EB",
    color: "#2C3318",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
  storyShareBtn: {
    flex: 1,
    padding: "10px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(95,133,32,0.25)",
  },

  /* STORY VIEWER STYLES */
  storyViewerOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 120,
    background: "rgba(10, 14, 8, 0.92)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
  },
  storyViewerCard: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    maxHeight: "90vh",
    height: "640px",
    background: "#161B12",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  storyProgressWrap: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    height: 3,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    zIndex: 10,
    overflow: "hidden",
  },
  storyProgressBar: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, #A8D63A, #FFFFFF)",
  },
  storyViewerHeader: {
    position: "absolute",
    top: 20,
    left: 14,
    right: 14,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storyAuthorRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  storyAuthorAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #A8D63A",
  },
  authorImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  authorFb: {
    width: "100%",
    height: "100%",
    background: "#46502B",
    color: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    fontWeight: "700",
  },
  storyAuthorName: {
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
  },
  storyTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "11px",
  },
  storyAddMoreBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#FFFFFF",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
  storyCloseBtn: {
    background: "rgba(0,0,0,0.4)",
    border: "none",
    color: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: "16px",
    cursor: "pointer",
  },
  storyImageWrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0D1109",
  },
  storyFullImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  storyCaptionPill: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    background: "rgba(20, 24, 14, 0.75)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "10px 16px",
    borderRadius: 16,
    color: "#FFFFFF",
    fontSize: "13px",
    textAlign: "center",
  },
  storyNavRow: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    display: "flex",
    justifyContent: "space-between",
  },
  storyNavBtn: {
    background: "rgba(255,255,255,0.18)",
    border: "none",
    color: "#FFFFFF",
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
