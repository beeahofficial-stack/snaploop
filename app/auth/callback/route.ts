import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert profile on first login
      const { user } = data;
      const username =
        user.user_metadata?.preferred_username ||
        user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ||
        `user_${user.id.slice(0, 8)}`;

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          username,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}/feed`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
