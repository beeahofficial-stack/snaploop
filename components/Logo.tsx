import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string | null;
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
};

export default function Logo({
  href = "/feed",
  size = 40,
  showWordmark = true,
  wordmarkSize = 20,
}: LogoProps) {
  const mark = (
    <span style={{ ...styles.wrap, gap: showWordmark ? 10 : 0 }}>
      <Image
        src="/logo.png"
        alt="SnapLoop"
        width={size}
        height={size}
        priority
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: Math.round(size * 0.22),
          flexShrink: 0,
          boxShadow: "0 6px 16px rgba(107, 154, 35, 0.18)",
        }}
      />
      {showWordmark && (
        <span style={{ ...styles.wordmark, fontSize: wordmarkSize }}>SnapLoop</span>
      )}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} style={styles.link}>
      {mark}
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  link: {
    display: "inline-flex",
    textDecoration: "none",
    alignItems: "center",
  },
  wrap: {
    display: "inline-flex",
    alignItems: "center",
  },
  wordmark: {
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#3F4A1C",
  },
};
