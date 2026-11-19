import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("snaploop_demo")?.value === "true";
  if (isDemo) redirect("/feed");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  redirect("/feed");
}
