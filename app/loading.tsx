export default function Loading() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo} />
        <div style={styles.line} />
        <div style={styles.lineShort} />
        <div style={styles.lineShort} />
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
    maxWidth: "420px",
    background: "#FFFFFF",
    border: "1px solid #E6E1D4",
    borderRadius: "28px",
    padding: "32px 24px",
    boxShadow: "0 18px 48px rgba(70,80,40,0.1)",
  },
  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #B5DE4E, #6B9A23)",
    margin: "0 auto 20px",
    animation: "softPulse 1.4s ease-in-out infinite",
  },
  line: {
    height: "18px",
    width: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #E8EBD8 0%, #E6E1D4 50%, #E8EBD8 100%)",
    marginBottom: "14px",
  },
  lineShort: {
    height: "12px",
    width: "72%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #E8EBD8 0%, #E6E1D4 50%, #E8EBD8 100%)",
    margin: "0 auto 12px",
  },
};
