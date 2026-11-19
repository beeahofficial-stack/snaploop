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
    <div style={styles.wrapper}>
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
    minHeight: "100vh",
    background: "#F6F3EB",
  },
  main: {
    flex: 1,
    marginLeft: "260px",
    minHeight: "100vh",
    paddingBottom: "88px",
    background: "#F6F3EB",
  },
};
