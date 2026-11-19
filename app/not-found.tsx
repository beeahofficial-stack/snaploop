import Link from "next/link";

export default function NotFound() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.badge}>404</div>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.text}>
          The page you were looking for doesn’t exist or may have moved.
        </p>
        <Link href="/feed" style={styles.button}>
          Back to feed
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#F6F3EB",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#FFFFFF",
    border: "1px solid #E6E1D4",
    borderRadius: "28px",
    padding: "36px 28px",
    textAlign: "center",
    boxShadow: "0 18px 48px rgba(70,80,40,0.1)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#2C3318",
    fontWeight: 700,
    fontSize: "28px",
    marginBottom: "18px",
  },
  title: {
    margin: "0 0 10px",
    color: "#2C3318",
    fontSize: "28px",
    letterSpacing: "-0.03em",
  },
  text: {
    margin: "0 0 24px",
    color: "#6F7658",
    lineHeight: 1.6,
    fontSize: "15px",
  },
  button: {
    display: "inline-block",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    color: "#2C3318",
    textDecoration: "none",
    borderRadius: "16px",
    padding: "12px 22px",
    fontWeight: 700,
  },
};
