"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import toast from "react-hot-toast";
import Logo from "@/components/Logo";

const HomeIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ExploreIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);

const PuzzleIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3a2 2 0 01-2 2h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H4a2 2 0 01-2-2v-3a1 1 0 001-1V9a2 2 0 012-2h3a1 1 0 001-1V4z" />
  </svg>
);

const BellIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await fetch("/api/auth/demo", { method: "DELETE" }).catch(() => {});
    await supabase.auth.signOut();
    toast.success("Logged out");
    router.push("/login");
  };

  const streak = profile?.style_prefs?.puzzleStats?.streak ?? 0;

  // Industry-standard social media order (Instagram / Pinterest order):
  // 1. Home
  // 2. Explore / Search
  // 3. Puzzles & Streaks (SnapLoop signature!)
  // 4. Notifications
  // 5. Profile
  // 6. Settings
  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile";

  const links = [
    {
      id: "home",
      href: "/feed",
      label: "Home",
      icon: <HomeIcon />,
      isActive: pathname === "/feed" || pathname === "/",
    },
    {
      id: "explore",
      href: "/explore",
      label: "Explore",
      icon: <ExploreIcon />,
      isActive: pathname.startsWith("/explore"),
    },
    {
      id: "puzzles",
      href: "/puzzles",
      label: "Puzzles",
      icon: <PuzzleIcon />,
      badge: streak > 0 ? `🔥 ${streak}` : `▶ Play`,
      isActive: pathname.startsWith("/puzzles"),
    },
    {
      id: "notifications",
      href: "/notifications",
      label: "Notifications",
      icon: <BellIcon />,
      isActive: pathname.startsWith("/notifications"),
    },
    {
      id: "profile",
      href: profileHref,
      label: "Profile",
      icon: <UserIcon />,
      isActive: pathname.startsWith("/profile"),
    },
    {
      id: "settings",
      href: "/settings",
      label: "Settings",
      icon: <SettingsIcon />,
      isActive: pathname.startsWith("/settings"),
    },
  ];

  return (
    <aside className="desktop-sidebar" style={styles.sidebar}>
      <div style={styles.logo}>
        <Logo href="/feed" size={40} wordmarkSize={20} />
      </div>

      <nav style={styles.nav}>
        {links.map(({ id, href, label, icon, badge, isActive }) => (
          <Link
            key={id}
            href={href}
            style={{
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            }}
          >
            <span style={{ ...styles.iconWrap, color: isActive ? "#5F8520" : "#6F7658" }}>
              {icon}
            </span>
            <span style={styles.navLabel}>{label}</span>
            {badge && (
              <span
                style={{
                  ...styles.badge,
                  background: isActive ? "#A8D63A" : "rgba(168, 214, 58, 0.22)",
                  color: isActive ? "#1E260F" : "#455E17",
                }}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Profile comfort card at bottom */}
      <div style={styles.bottom}>
        {profile ? (
          <Link href={profileHref} style={styles.profileChip} title="Open Comfort Zone Profile">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>
                {(profile.full_name || profile.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>
                {profile.style_prefs?.showMood && profile.style_prefs?.moodEmoji ? `${profile.style_prefs.moodEmoji} ` : ""}
                {profile.full_name || profile.username}
              </div>
              <div style={styles.profileUsername}>@{profile.username}</div>
            </div>
          </Link>
        ) : (
          <div style={styles.loadingProfile}>Loading profile...</div>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn} title="Log Out">
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: "260px",
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid #E6E1D4",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    zIndex: 100,
    boxShadow: "2px 0 20px rgba(44, 51, 24, 0.03)",
  },
  logo: {
    marginBottom: "32px",
    padding: "4px 8px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    padding: "4px 0",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "11px 14px",
    borderRadius: "16px",
    color: "#6F7658",
    fontSize: "15px",
    fontWeight: "500",
    textDecoration: "none",
    transition: "all 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
    position: "relative",
  },
  navLinkActive: {
    background: "rgba(168, 214, 58, 0.18)",
    color: "#2C3318",
    fontWeight: 700,
    border: "1px solid rgba(118, 154, 40, 0.28)",
    boxShadow: "0 4px 14px rgba(118, 154, 40, 0.08)",
  },
  iconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease",
  },
  navLabel: {
    flex: 1,
  },
  badge: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "999px",
    letterSpacing: "0.02em",
  },
  bottom: {
    borderTop: "1px solid #E6E1D4",
    paddingTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: "14px",
    background: "rgba(246, 243, 235, 0.6)",
    transition: "background 0.2s ease, transform 0.2s ease",
    minWidth: 0,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1.5px solid #DCE6C8",
  },
  avatarFallback: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(107, 154, 35, 0.25)",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2C3318",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileUsername: {
    fontSize: "11px",
    color: "#9A9F86",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  loadingProfile: {
    fontSize: "12px",
    color: "#9A9F86",
    flex: 1,
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    color: "#9A9F86",
    padding: "8px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
};
