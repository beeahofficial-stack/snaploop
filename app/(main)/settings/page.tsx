import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";
import { normalizeStylePrefs } from "@/lib/stylePrefs";
import { getCurrentSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect("/login");
  }

  const safeProfile = {
    ...session.profile,
    style_prefs: normalizeStylePrefs(session.profile.style_prefs),
  };

  return <SettingsClient profile={safeProfile} />;
}
