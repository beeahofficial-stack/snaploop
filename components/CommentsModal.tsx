"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Post, Comment } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CommentsModal({
  post, onClose, onCommentAdded,
}: {
  post: Post;
  onClose: () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/comments?postId=${post.id}`)
      .then(async r => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          const message = data?.message || data?.error || `Could not load comments (${r.status})`;
          console.error("[CommentsModal] Load failed:", { status: r.status, data });
          toast.error(message);
        } else {
          setComments(data?.comments ?? []);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("[CommentsModal] Network load failed:", error);
        toast.error("Could not reach the comments service. Please try again.");
        setLoading(false);
      });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [post.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, body }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setComments(c => [...c, data.comment]);
        setBody("");
        onCommentAdded();
      } else {
        const message = data?.message || data?.error || `Comment failed (${res.status})`;
        console.error("[CommentsModal] Submit failed:", { status: res.status, data });
        toast.error(message);
      }
    } catch (error) {
      console.error("[CommentsModal] Network submit failed:", error);
      toast.error("Could not reach the comments service. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="comments-modal" style={modal} onClick={e => e.stopPropagation()}>
        <div style={mHeader}>
          <span style={mTitle}>Comments</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={body_}>
          {loading ? (
            <div style={centered}>Loading…</div>
          ) : comments.length === 0 ? (
            <div style={centered}>No comments yet. Be first! 💬</div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={commentRow}>
                <Link href={`/profile/${c.profiles.username}`}>
                  {c.profiles.avatar_url ? (
                    <div style={avatarWrap}>
                      <Image src={c.profiles.avatar_url} alt="" width={32} height={32} style={avatar} />
                    </div>
                  ) : (
                    <div style={avatarFb}>{(c.profiles.full_name || c.profiles.username || "?")[0].toUpperCase()}</div>
                  )}
                </Link>
                <div style={commentContent}>
                  <div style={commentMeta}>
                    <span style={commenterName}>{c.profiles.full_name || c.profiles.username}</span>
                    <span style={time}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={commentBody}>{c.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submit} style={inputRow}>
          <input
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a comment…"
            style={input}
            maxLength={500}
          />
          <button type="submit" disabled={!body.trim() || posting} style={sendBtn}>
            {posting ? "…" : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(44,51,24,0.45)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  zIndex: 1000, padding: "0",
};
const modal: React.CSSProperties = {
  background: "#FFFFFF", borderRadius: "24px 24px 0 0",
  border: "1px solid #E6E1D4", width: "100%", maxWidth: "580px",
  maxHeight: "70vh", display: "flex", flexDirection: "column",
  boxShadow: "0 -12px 40px rgba(70, 80, 40, 0.12)",
};
const mHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", borderBottom: "1px solid #E6E1D4",
};
const mTitle: React.CSSProperties = { fontSize: "16px", fontWeight: "700", color: "#2C3318" };
const closeBtn: React.CSSProperties = {
  background: "transparent", border: "none", color: "#6F7658",
  fontSize: "18px", cursor: "pointer", padding: "4px 8px",
};
const body_: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "12px 20px" };
const centered: React.CSSProperties = { textAlign: "center", color: "#9A9F86", padding: "24px", fontSize: "14px" };
const commentRow: React.CSSProperties = { display: "flex", gap: "10px", marginBottom: "14px" };
const avatarWrap: React.CSSProperties = { width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 };
const avatar: React.CSSProperties = { width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", display: "block" };
const avatarFb: React.CSSProperties = {
  width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
  background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#2C3318", fontWeight: "700", fontSize: "13px",
};
const commentContent: React.CSSProperties = { flex: 1 };
const commentMeta: React.CSSProperties = { display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px" };
const commenterName: React.CSSProperties = { fontSize: "13px", fontWeight: "600", color: "#2C3318" };
const time: React.CSSProperties = { fontSize: "11px", color: "#9A9F86" };
const commentBody: React.CSSProperties = { fontSize: "14px", color: "#555C40", lineHeight: "1.5" };
const inputRow: React.CSSProperties = {
  display: "flex", gap: "10px", padding: "14px 16px",
  borderTop: "1px solid #E6E1D4",
};
const input: React.CSSProperties = {
  flex: 1, background: "#EEF1E4", border: "1px solid #E6E1D4",
  borderRadius: "10px", padding: "10px 14px",
  color: "#2C3318", fontSize: "14px",
};
const sendBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: "10px",
  background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
  border: "none", color: "#2C3318", fontWeight: "600",
  fontSize: "14px", cursor: "pointer",
};
