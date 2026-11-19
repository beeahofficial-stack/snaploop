"use client";
import { Notification } from "@/lib/types";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const notifText: Record<string, string> = {
  like: "liked your post ❤️",
  comment: "commented on your post 💬",
  follow: "started following you 👋",
};

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Notifications 🔔</h1>
      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔕</div>
          <p style={{ color: "#6F7658", fontSize: "15px" }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map(n => (
            <Link
              key={n.id}
              href={n.post_id ? `/profile/${n.actor?.username}` : `/profile/${n.actor?.username}`}
              style={{ ...styles.row, ...(n.read ? {} : styles.unread) }}
            >
              {n.actor?.avatar_url ? (
                <img src={n.actor.avatar_url} alt="" style={styles.avatar} />
              ) : (
                <div style={styles.avatarFb}>
                  {(n.actor?.full_name || n.actor?.username || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div style={styles.content}>
                <span style={styles.actor}>{n.actor?.full_name || n.actor?.username}</span>
                {" "}
                <span style={styles.action}>{notifText[n.type] || "interacted with you"}</span>
                <div style={styles.time}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <div style={styles.dot} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "680px", margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: "24px", fontWeight: "800", color: "#2C3318", marginBottom: "20px", letterSpacing: "-0.03em" },
  empty: {
    textAlign: "center", padding: "60px 24px",
    background: "#FFFFFF", borderRadius: "22px", border: "1px solid #E6E1D4",
    boxShadow: "0 10px 28px rgba(70, 80, 40, 0.07)",
  },
  list: {
    background: "#FFFFFF", border: "1px solid #E6E1D4", borderRadius: "22px",
    overflow: "hidden", boxShadow: "0 10px 28px rgba(70, 80, 40, 0.07)",
  },
  row: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "14px 16px", borderBottom: "1px solid #EEF1E4",
    textDecoration: "none", transition: "background 0.15s",
  },
  unread: { background: "rgba(168,214,58,0.05)" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  avatarFb: {
    width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#2C3318", fontWeight: "700", fontSize: "16px",
  },
  content: { flex: 1, fontSize: "14px", color: "#555C40", lineHeight: "1.5" },
  actor: { fontWeight: "700", color: "#2C3318" },
  action: { color: "#6F7658" },
  time: { fontSize: "12px", color: "#9A9F86", marginTop: "2px" },
  dot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#A8D63A", flexShrink: 0,
  },
};
