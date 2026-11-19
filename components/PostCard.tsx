"use client";
import Image from "next/image";
import { useState } from "react";
import { Post } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";
import CommentsModal from "./CommentsModal";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked ?? false);
  const [likeCount, setLikeCount] = useState(Number(post.likes?.[0]?.count ?? 0));
  const [commentCount, setCommentCount] = useState(Number(post.comments?.[0]?.count ?? 0));
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    if (!res.ok) {
      setLiked(liked);
      setLikeCount(liked ? likeCount : likeCount - 1);
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    if (res.ok) {
      toast.success("Post deleted");
      onDelete?.(post.id);
    } else {
      toast.error("Failed to delete");
    }
  };

  const profile = post.profiles;
  const isOwner = post.user_id === currentUserId;

  return (
    <>
      <article style={styles.card}>
        {/* IG header */}
        <div style={styles.header}>
          <Link href={`/profile/${profile.username}`} style={styles.userInfo}>
            {profile.avatar_url ? (
              <div style={styles.avatarWrap}>
                <Image src={profile.avatar_url} alt="" width={36} height={36} style={styles.avatar} />
              </div>
            ) : (
              <div style={styles.avatarFallback}>
                {(profile.full_name || profile.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={styles.name}>{profile.username}</div>
              <div style={styles.meta}>{timeAgo(post.created_at)}</div>
            </div>
          </Link>
          {isOwner && (
            <button onClick={handleDelete} style={styles.deleteBtn} title="Delete post">
              ···
            </button>
          )}
        </div>

        {/* Media first (Instagram) */}
        {post.image_url ? (
          <div style={styles.imageWrap} onDoubleClick={handleLike}>
            <Image src={post.image_url} alt="Post" width={800} height={800} style={styles.image} />
          </div>
        ) : (
          <div style={styles.textOnly}>
            <p style={styles.textOnlyCaption}>{post.caption}</p>
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <button
            onClick={handleLike}
            style={{ ...styles.actionBtn, ...(liked ? styles.likedBtn : {}) }}
          >
            <span
              style={{
                display: "inline-block",
                transform: likeAnim ? "scale(1.35)" : "scale(1)",
                transition: "transform 0.2s",
              }}
            >
              {liked ? "❤️" : "🤍"}
            </span>
          </button>
          <button onClick={() => setShowComments(true)} style={styles.actionBtn}>
            💬
          </button>
        </div>

        <div style={styles.counts}>
          {likeCount > 0 && <span style={styles.likes}>{likeCount} likes</span>}
        </div>

        {/* Caption under media */}
        {post.image_url && post.caption && (
          <p style={styles.caption}>
            <Link href={`/profile/${profile.username}`} style={styles.captionUser}>
              {profile.username}
            </Link>{" "}
            {post.caption}
          </p>
        )}

        {commentCount > 0 && (
          <button onClick={() => setShowComments(true)} style={styles.viewComments}>
            View all {commentCount} comments
          </button>
        )}
      </article>

      {showComments && (
        <CommentsModal
          post={post}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount((c) => c + 1)}
        />
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#FFFFFF",
    border: "1px solid #E6E1D4",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
  },
  userInfo: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none" },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #B5DE4E",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2C3318",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  name: { fontSize: 13, fontWeight: 700, color: "#2C3318" },
  meta: { fontSize: 11, color: "#9A9F86" },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#6F7658",
    cursor: "pointer",
    fontSize: 18,
    letterSpacing: 2,
    padding: "4px 8px",
  },
  imageWrap: {
    width: "100%",
    background: "#EEF1E4",
    aspectRatio: "1 / 1",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  textOnly: {
    padding: "28px 20px",
    background: "linear-gradient(135deg, #EEF1E4, #F6F3EB)",
    minHeight: 140,
    display: "flex",
    alignItems: "center",
  },
  textOnlyCaption: {
    fontSize: 18,
    fontWeight: 600,
    color: "#2C3318",
    lineHeight: 1.45,
    margin: 0,
  },
  actions: { display: "flex", gap: 4, padding: "8px 8px 0" },
  actionBtn: {
    background: "transparent",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: "4px 8px",
    lineHeight: 1,
  },
  likedBtn: {},
  counts: { padding: "2px 14px 0" },
  likes: { fontSize: 13, fontWeight: 700, color: "#2C3318" },
  caption: {
    padding: "6px 14px 4px",
    fontSize: 13,
    color: "#3F4630",
    lineHeight: 1.45,
    margin: 0,
  },
  captionUser: { fontWeight: 700, color: "#2C3318", textDecoration: "none" },
  viewComments: {
    display: "block",
    background: "transparent",
    border: "none",
    color: "#9A9F86",
    fontSize: 13,
    padding: "4px 14px 12px",
    cursor: "pointer",
    textAlign: "left",
  },
};
