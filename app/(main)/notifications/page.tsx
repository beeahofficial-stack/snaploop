import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/NotificationsClient";
import { getCurrentSession } from "@/lib/auth/session";

import { Notification } from "@/lib/types";

export default async function NotificationsPage() {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.profile) redirect("/login");

  let notifications: Notification[] = [];

  try {
    const supabase = await createClient();
    if (session.user) {
      const { data } = await supabase
        .from("notifications")
        .select(`*, actor:profiles!notifications_actor_id_fkey(*)`)
        .eq("recipient_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      notifications = data ?? [];

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", session.user.id)
        .eq("read", false);
    }
  } catch {
    notifications = [];
  }

  return <NotificationsClient notifications={notifications} />;
}
