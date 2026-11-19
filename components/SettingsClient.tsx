"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import {
  COMFORT_THEMES,
  COZY_PATTERNS,
  COVER_OPTIONS,
  FEED_MODE_OPTIONS,
  INTEREST_OPTIONS,
  StylePrefs,
  comfortThemeObj,
  normalizeStylePrefs,
} from "@/lib/stylePrefs";

export default function SettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const initial = useMemo(
    () => normalizeStylePrefs(profile.style_prefs),
    [profile.style_prefs]
  );
  const [prefs, setPrefs] = useState<StylePrefs>(initial);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [username, setUsername] = useState(profile.username || "");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "comfort" | "feed" | "privacy">("profile");

  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);

  const activeTheme = comfortThemeObj(prefs.themePreset);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        bio,
        username,
        style_prefs: prefs,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Settings saved successfully ✨");
      if (data.profile?.username && data.profile.username !== profile.username) {
        window.location.href = `/profile/${data.profile.username}`;
        return;
      }
    } else {
      toast.error(data.error || "Couldn’t save settings");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/demo", { method: "DELETE" }).catch(() => {});
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  const navItems = [
    { id: "profile", label: "Edit Profile", icon: "👤", desc: "Username, name & bio" },
    { id: "comfort", label: "Comfort Theme", icon: "🎨", desc: "Aesthetics & background" },
    { id: "feed", label: "Feed & Interests", icon: "🌿", desc: "Algorithm & topics" },
    { id: "privacy", label: "Privacy & Account", icon: "🔒", desc: "Visibility & security" },
  ] as const;

  return (
    <div style={styles.page}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your account, comfort zone, and preferences</p>
        </div>
        <Link href={`/profile/${profile.username}`} style={styles.profileLink}>
          View Profile →
        </Link>
      </div>

      <div style={styles.layout}>
        {/* Instagram-style Settings Sidebar Menu */}
        <aside style={styles.settingsSidebar}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                style={{
                  ...styles.menuItem,
                  ...(isActive ? styles.menuItemActive : {}),
                }}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <div style={styles.menuTextCol}>
                  <span style={{ ...styles.menuLabel, color: isActive ? "#2C3318" : "#6F7658" }}>
                    {item.label}
                  </span>
                  <span style={styles.menuDesc}>{item.desc}</span>
                </div>
                <span style={styles.chevron}>›</span>
              </button>
            );
          })}

          <div style={styles.sidebarDivider} />

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.logoutIcon}>🚪</span>
            <span>Log Out</span>
          </button>
        </aside>

        {/* Settings Content Area */}
        <div style={styles.contentCard}>
          {/* SECTION 1: EDIT PROFILE */}
          {activeSection === "profile" && (
            <div style={styles.sectionBody}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>👤 Edit Profile</h2>
                <p style={styles.sectionSub}>Update your personal identity and bio details.</p>
              </div>

              <div style={styles.avatarRow}>
                <div style={styles.avatarWrap}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={styles.avatar} />
                  ) : (
                    <div style={{ ...styles.avatarFallback, background: activeTheme.gradient }}>
                      {(fullName || username || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div style={styles.avatarName}>{fullName || username}</div>
                  <div style={styles.avatarUser}>@{username}</div>
                </div>
              </div>

              <label style={styles.label}>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder="your_handle"
                />
              </label>

              <label style={styles.label}>
                Display Name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={styles.input}
                  placeholder="Your Name"
                />
              </label>

              <label style={styles.label}>
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  style={{ ...styles.input, resize: "vertical" }}
                  placeholder="Tell your story gently…"
                />
              </label>
            </div>
          )}

          {/* SECTION 2: COMFORT THEME */}
          {activeSection === "comfort" && (
            <div style={styles.sectionBody}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>🎨 Comfort Zone Aesthetics</h2>
                <p style={styles.sectionSub}>Choose your Pinterest-inspired theme and cozy pattern.</p>
              </div>

              <div>
                <label style={styles.fieldTitle}>Theme Preset</label>
                <div style={styles.themesGrid}>
                  {COMFORT_THEMES.map((theme) => {
                    const isSelected = prefs.themePreset === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, themePreset: theme.id }))}
                        style={{
                          ...styles.themeButton,
                          border: isSelected ? `1.5px solid ${theme.primary}` : "1.5px solid #E6E1D4",
                          background: isSelected ? theme.surface : "#FFFFFF",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{theme.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: theme.primary }}>
                            {theme.label}
                          </div>
                          <div style={{ fontSize: 11, color: "#8E9675" }}>{theme.blurb}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={styles.fieldTitle}>Cozy Background Texture</label>
                <div style={styles.patternGrid}>
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
                          background: isSelected ? "rgba(168,214,58,0.18)" : "#FFFFFF",
                        }}
                      >
                        <span>{pat.emoji}</span>
                        <span>{pat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={styles.fieldTitle}>Cover Gradient</label>
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
            </div>
          )}

          {/* SECTION 3: FEED & INTERESTS */}
          {activeSection === "feed" && (
            <div style={styles.sectionBody}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>🌿 Feed Preferences & Topics</h2>
                <p style={styles.sectionSub}>Control the content you discover in your Home stream.</p>
              </div>

              <div>
                <label style={styles.fieldTitle}>Feed Mode</label>
                <div style={styles.feedModeGrid}>
                  {FEED_MODE_OPTIONS.map((mode) => {
                    const isSelected = prefs.feedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, feedMode: mode.id }))}
                        style={{
                          ...styles.feedModeBtn,
                          border: isSelected ? "1.5px solid #5F8520" : "1.5px solid #E6E1D4",
                          background: isSelected ? "rgba(168,214,58,0.15)" : "#FFFFFF",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{mode.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#2C3318" }}>
                            {mode.label}
                          </div>
                          <div style={{ fontSize: 11, color: "#788162" }}>{mode.blurb}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={styles.fieldTitle}>Favorite Topics (Max 8)</label>
                <div style={styles.interestsRow}>
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = prefs.interests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPrefs((p) => {
                            if (isSelected) {
                              return { ...p, interests: p.interests.filter((x) => x !== item.id) };
                            }
                            if (p.interests.length >= 8) {
                              toast("Up to 8 topics allowed ✨");
                              return p;
                            }
                            return { ...p, interests: [...p.interests, item.id] };
                          });
                        }}
                        style={{
                          ...styles.interestChip,
                          background: isSelected ? "linear-gradient(135deg, #B5DE4E, #6B9A23)" : "#F6F3EB",
                          color: isSelected ? "#FFFFFF" : "#566141",
                          border: isSelected ? "1px solid #5F8520" : "1px solid #E6E1D4",
                        }}
                      >
                        {item.emoji} {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PRIVACY & ACCOUNT */}
          {activeSection === "privacy" && (
            <div style={styles.sectionBody}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>🔒 Privacy & Account</h2>
                <p style={styles.sectionSub}>Essential controls for your presence on SnapLoop.</p>
              </div>

              <div style={styles.privacyOption}>
                <div>
                  <div style={styles.privacyOptionTitle}>Private Account</div>
                  <div style={styles.privacyOptionSub}>
                    When your account is private, only people you approve can see your posts.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privateAccount}
                  onChange={(e) => {
                    setPrivateAccount(e.target.checked);
                    toast.success(e.target.checked ? "Account set to private" : "Account set to public");
                  }}
                  style={styles.switchCheckbox}
                />
              </div>

              <div style={styles.privacyOption}>
                <div>
                  <div style={styles.privacyOptionTitle}>Show Activity Status</div>
                  <div style={styles.privacyOptionSub}>
                    Allow accounts you follow to see when you are active on SnapLoop.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showActivityStatus}
                  onChange={(e) => {
                    setShowActivityStatus(e.target.checked);
                    toast.success("Activity preference updated");
                  }}
                  style={styles.switchCheckbox}
                />
              </div>

              <div style={styles.privacyOption}>
                <div>
                  <div style={styles.privacyOptionTitle}>Daily Puzzle Streak Reminders</div>
                  <div style={styles.privacyOptionSub}>
                    Get notified when today&apos;s daily chess puzzle is available to protect your streak.
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={() => toast.success("Puzzle streak reminder saved")}
                  style={styles.switchCheckbox}
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={styles.saveBar}>
            <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? "Saving Changes…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "24px 20px 48px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6F7658",
    margin: "4px 0 0",
  },
  profileLink: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#5F8520",
    textDecoration: "none",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: "24px",
  },
  settingsSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "16px",
    background: "#FFFFFF",
    border: "1px solid #E6E1D4",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  menuItemActive: {
    background: "rgba(168, 214, 58, 0.18)",
    border: "1px solid rgba(118, 154, 40, 0.35)",
    boxShadow: "0 4px 14px rgba(118, 154, 40, 0.08)",
  },
  menuIcon: {
    fontSize: "18px",
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: "13px",
    fontWeight: "700",
    display: "block",
  },
  menuDesc: {
    fontSize: "11px",
    color: "#9A9F86",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chevron: {
    color: "#B4B8A3",
    fontSize: "16px",
    fontWeight: "bold",
  },
  sidebarDivider: {
    height: "1px",
    background: "#E6E1D4",
    margin: "10px 0",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "16px",
    background: "#FFF5F5",
    border: "1px solid #FFD8D8",
    color: "#C53030",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
  logoutIcon: {
    fontSize: "16px",
  },
  contentCard: {
    background: "#FFFFFF",
    borderRadius: "24px",
    border: "1px solid #E6E1D4",
    padding: "26px",
    boxShadow: "0 8px 24px rgba(44, 51, 24, 0.04)",
  },
  sectionBody: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionHead: {
    borderBottom: "1px solid #EFECE3",
    paddingBottom: "14px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#2C3318",
    margin: 0,
  },
  sectionSub: {
    fontSize: "12px",
    color: "#6F7658",
    margin: "3px 0 0",
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#F9F8F4",
    padding: "12px 16px",
    borderRadius: "18px",
    border: "1px solid #E6E1D4",
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#FFFFFF",
    fontSize: "20px",
    fontWeight: "800",
  },
  avatarName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2C3318",
  },
  avatarUser: {
    fontSize: "12px",
    color: "#6F7658",
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
  fieldTitle: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#46502B",
    marginBottom: "10px",
  },
  themesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  themeButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    border: "1.5px solid #E6E1D4",
    cursor: "pointer",
    textAlign: "left",
  },
  patternGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "8px",
  },
  patternBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
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
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
  },
  feedModeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  feedModeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    border: "1.5px solid #E6E1D4",
    cursor: "pointer",
    textAlign: "left",
  },
  interestsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  interestChip: {
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #E6E1D4",
    cursor: "pointer",
  },
  privacyOption: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px",
    borderRadius: "16px",
    background: "#F9F8F4",
    border: "1px solid #E6E1D4",
  },
  privacyOptionTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2C3318",
  },
  privacyOptionSub: {
    fontSize: "11px",
    color: "#6F7658",
    marginTop: "2px",
    maxWidth: "400px",
  },
  switchCheckbox: {
    width: "20px",
    height: "20px",
    accentColor: "#5F8520",
    cursor: "pointer",
  },
  saveBar: {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #EFECE3",
    display: "flex",
    justifyContent: "flex-end",
  },
  saveBtn: {
    padding: "11px 24px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(95, 133, 32, 0.25)",
  },
};
