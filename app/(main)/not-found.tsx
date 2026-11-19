import Link from "next/link";

export default function MainNotFound() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>🌱</div>
        <h2 style={styles.title}>Page not found</h2>
        <p style={styles.text}>
          This page doesn’t exist or may have been moved.
        </p>
        <Link href="/feed" style={styles.btn}>
          Back to Feed
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "75vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    maxWidth: "420px",
    width: "100%",
    background: "#FFFFFF",
    borderRadius: "24px",
    border: "1px solid #E6E1D4",
    padding: "36px 28px",
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(44, 51, 24, 0.06)",
  },
  icon: {
    fontSize: "44px",
    marginBottom: "14px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#2C3318",
    margin: "0 0 8px",
  },
  text: {
    fontSize: "14px",
    color: "#6F7658",
    lineHeight: 1.5,
    margin: "0 0 24px",
  },
  btn: {
    display: "inline-block",
    padding: "10px 22px",
    background: "linear-gradient(135deg, #A8D63A, #5F8520)",
    color: "#FFFFFF",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "13px",
    textDecoration: "none",
  },
};
