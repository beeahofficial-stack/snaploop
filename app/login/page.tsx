"use client";

import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim() || username.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Welcome to SnapLoop, ${data.profile?.full_name || username}! ✨`, {
          icon: "🌱",
        });
        router.push("/feed");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Welcome back, ${data.profile?.full_name || "friend"}! 🌿`);
        router.push("/feed");
        router.refresh();
      } else {
        toast.error(data.error || "Invalid email or password");
      }
    } catch {
      toast.error("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in timed out");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        toast.success("Welcome to SnapLoop! ✨", { icon: "🌿" });
        router.push("/feed");
        router.refresh();
      } else {
        toast.error("Couldn't start demo session");
        setDemoLoading(false);
      }
    } catch {
      toast.error("Failed to connect");
      setDemoLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <Logo href={null} size={50} wordmarkSize={26} />
        </div>

        <h1 style={styles.heading}>
          {tab === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p style={styles.subheading}>
          Share moments, style your comfort zone & solve chess streaks 🌱
        </p>

        {/* Tab Switcher */}
        <div style={styles.tabBar}>
          <button
            type="button"
            onClick={() => setTab("signup")}
            style={{
              ...styles.tabBtn,
              ...(tab === "signup" ? styles.tabBtnActive : {}),
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setTab("login")}
            style={{
              ...styles.tabBtn,
              ...(tab === "login" ? styles.tabBtnActive : {}),
            }}
          >
            Log In
          </button>
        </div>

        {/* Signup Form */}
        {tab === "signup" && (
          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Beeah"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. beeahofficial"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password (min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? "Creating your account…" : "Create Account ✨"}
            </button>
          </form>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign In 🌿"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || demoLoading}
          style={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Instant Guest Demo Preview Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading || demoLoading}
          style={styles.demoBtn}
        >
          <span>⚡</span>
          <span>{demoLoading ? "Entering SnapLoop…" : "Instant Guest Preview"}</span>
        </button>

        <p style={styles.terms}>
          By continuing, you agree to SnapLoop’s{" "}
          <span style={styles.link}>Terms</span> and{" "}
          <span style={styles.link}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F6F3EB",
    position: "relative",
    overflow: "hidden",
    padding: "24px 16px",
  },
  blob1: {
    position: "absolute",
    width: "480px",
    height: "480px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,214,58,0.20) 0%, transparent 70%)",
    top: "-120px",
    left: "-100px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(95,133,32,0.14) 0%, transparent 70%)",
    bottom: "-100px",
    right: "-80px",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#FFFFFF",
    borderRadius: "28px",
    border: "1px solid #E6E1D4",
    padding: "32px 28px",
    boxShadow: "0 18px 48px rgba(44,51,24,0.08)",
    position: "relative",
    zIndex: 1,
    textAlign: "center",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#2C3318",
    margin: "0 0 6px",
    letterSpacing: "-0.03em",
  },
  subheading: {
    fontSize: "13px",
    color: "#6F7658",
    margin: "0 0 20px",
    lineHeight: 1.45,
  },
  tabBar: {
    display: "flex",
    background: "#F6F3EB",
    borderRadius: "14px",
    padding: "4px",
    marginBottom: "20px",
    border: "1px solid #E6E1D4",
  },
  tabBtn: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "#6F7658",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  tabBtnActive: {
    background: "#FFFFFF",
    color: "#2C3318",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(44,51,24,0.08)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    textAlign: "left",
    marginBottom: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#46502B",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1.5px solid #E6E1D4",
    background: "#FAF9F5",
    fontSize: "14px",
    color: "#2C3318",
    outline: "none",
    boxSizing: "border-box",
  },
  primaryBtn: {
    marginTop: "6px",
    width: "100%",
    padding: "12px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(95,133,32,0.25)",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "18px 0 14px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#EFECE3",
  },
  dividerText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9CA388",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "11px 16px",
    borderRadius: "14px",
    border: "1.5px solid #E6E1D4",
    background: "#FFFFFF",
    color: "#2C3318",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "10px",
  },
  demoBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1px dashed #C8DE7A",
    background: "#F7FAEB",
    color: "#46502B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  terms: {
    fontSize: "11px",
    color: "#9CA388",
    marginTop: "18px",
    marginBottom: 0,
    lineHeight: 1.5,
  },
  link: {
    color: "#5F8520",
    textDecoration: "underline",
    cursor: "pointer",
  },
};
