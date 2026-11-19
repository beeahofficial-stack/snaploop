"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Profile } from "@/lib/types";

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const streak = profile?.style_prefs?.puzzleStats?.streak ?? 0;
  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile";

  const links = [
    {
      id: "home",
      href: "/feed",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Home",
      isActive: pathname === "/feed" || pathname === "/",
    },
    {
      id: "explore",
      href: "/explore",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
        </svg>
      ),
      label: "Explore",
      isActive: pathname.startsWith("/explore"),
    },
    {
      id: "puzzles",
      href: "/puzzles",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3a2 2 0 01-2 2h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H4a2 2 0 01-2-2v-3a1 1 0 001-1V9a2 2 0 012-2h3a1 1 0 001-1V4z" />
        </svg>
      ),
      badge: streak > 0 ? `🔥${streak}` : undefined,
      label: "Puzzles",
      isActive: pathname.startsWith("/puzzles"),
    },
    {
      id: "notifications",
      href: "/notifications",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: "Alerts",
      isActive: pathname.startsWith("/notifications"),
    },
    {
      id: "profile",
      href: profileHref,
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: "Profile",
      isActive: pathname.startsWith("/profile"),
    },
  ];

  return (
    <nav className="mobile-nav" style={styles.nav}>
      {links.map(({ id, href, icon, label, badge, isActive }) => (
        <Link
          key={id}
          href={href}
          style={{
            ...styles.link,
            color: isActive ? "#5F8520" : "#6F7658",
          }}
        >
          <div style={styles.iconWrap}>
            {icon}
            {badge && <span style={styles.badge}>{badge}</span>}
          </div>
          <span style={{ ...styles.label, fontWeight: isActive ? "700" : "500" }}>{label}</span>
          {isActive && <div style={styles.activeDot} />}
        </Link>
      ))}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "64px",
    background: "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid #E6E1D4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 10px",
    zIndex: 100,
    boxShadow: "0 -4px 20px rgba(44, 51, 24, 0.04)",
  },
  link: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    textDecoration: "none",
    padding: "6px 12px",
    position: "relative",
    transition: "transform 0.15s ease",
  },
  iconWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-12px",
    fontSize: "9px",
    fontWeight: "800",
    background: "#A8D63A",
    color: "#1E260F",
    padding: "1px 5px",
    borderRadius: "999px",
    border: "1px solid #FFFFFF",
    lineHeight: 1.2,
  },
  label: {
    fontSize: "11px",
    letterSpacing: "-0.01em",
  },
  activeDot: {
    position: "absolute",
    bottom: "2px",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#5F8520",
  },
};
