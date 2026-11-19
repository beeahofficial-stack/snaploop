import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export default async function DefaultProfileRedirectPage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect("/login");
  }

  redirect(`/profile/${session.profile.username}`);
}
