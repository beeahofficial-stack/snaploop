import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { getCurrentSession } from "@/lib/auth/session";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect("/login");
  }

  return (
    <div data-snaploop-root style={styles.wrapper}>
      <Sidebar profile={session.profile} />
      <main className="main-shell" style={styles.main}>
        {children}
      </main>
      <MobileNav profile={session.profile} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    minHeight: "100vh",
    background: "#F6F3EB",
  },
  main: {
    flex: 1,
    minWidth: 0,
    marginLeft: "260px",
    minHeight: "100vh",
    paddingBottom: "88px",
    background: "#F6F3EB",
  },
};
