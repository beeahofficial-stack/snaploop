"use client";
import { useState } from "react";
import { Post } from "@/lib/types";
import PostCard from "./PostCard";

export default function ExploreClient({
  initialPosts,
  currentUserId,
}: {
  initialPosts: Post[];
  currentUserId: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.users ?? []);
    setSearching(false);
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <h1 style={styles.title}>Explore ✨</h1>

        {/* Search box */}
        <div style={styles.searchWrap}>
          <svg style={styles.searchIcon} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6F7658" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search people…"
            style={styles.searchInput}
          />
        </div>

        {/* Search results */}
        {search.trim() && (
          <div style={styles.searchResults}>
            {searching && <div style={styles.hint}>Searching…</div>}
            {!searching && searchResults.length === 0 && <div style={styles.hint}>No users found</div>}
            {searchResults.map(u => (
              <a key={u.id} href={`/profile/${u.username}`} style={styles.userRow}>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFb}>{(u.full_name || u.username || "?")[0].toUpperCase()}</div>
                )}
                <div>
                  <div style={styles.uname}>{u.full_name || u.username}</div>
                  <div style={styles.usub}>@{u.username}</div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Posts grid */}
        {!search.trim() && (
          <>
            <h2 style={styles.sectionTitle}>Recent Posts</h2>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "680px", margin: "0 auto", padding: "24px 16px" },
  inner: { width: "100%" },
  title: { fontSize: "24px", fontWeight: "800", color: "#2C3318", marginBottom: "20px", letterSpacing: "-0.03em" },
  searchWrap: {
    position: "relative", display: "flex", alignItems: "center",
    marginBottom: "16px",
  },
  searchIcon: { position: "absolute", left: "14px", pointerEvents: "none" },
  searchInput: {
    width: "100%", padding: "12px 14px 12px 42px",
    background: "#FFFFFF", border: "1px solid #E6E1D4",
    borderRadius: "16px", color: "#2C3318", fontSize: "14px",
    boxSizing: "border-box",
    boxShadow: "0 6px 18px rgba(70, 80, 40, 0.05)",
  },
  searchResults: {
    background: "#FFFFFF", border: "1px solid #E6E1D4",
    borderRadius: "18px", overflow: "hidden", marginBottom: "20px",
    boxShadow: "0 10px 28px rgba(70, 80, 40, 0.07)",
  },
  hint: { padding: "16px", color: "#9A9F86", fontSize: "14px", textAlign: "center" },
  userRow: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 16px", borderBottom: "1px solid #EEF1E4",
    textDecoration: "none", transition: "background 0.15s",
  },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" },
  avatarFb: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#2C3318", fontWeight: "700", fontSize: "15px", flexShrink: 0,
  },
  uname: { fontSize: "14px", fontWeight: "600", color: "#2C3318" },
  usub: { fontSize: "12px", color: "#9A9F86" },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#2C3318", marginBottom: "16px" },
};
