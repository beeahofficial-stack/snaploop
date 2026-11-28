import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // 1. Purge stale non-UUID snaploop_user cookie (e.g. old "user_1795242354968")
  const userCookie = request.cookies.get("snaploop_user")?.value;
  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie);
      const isUUIDFormat =
        typeof parsed?.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id);
      if (!isUUIDFormat) {
        request.cookies.delete("snaploop_user");
        supabaseResponse.cookies.delete("snaploop_user");
      }
    } catch {
      request.cookies.delete("snaploop_user");
      supabaseResponse.cookies.delete("snaploop_user");
    }
  }

  // 2. Public paths that never require authentication
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/";

  // 3. Supabase Auth check & session cookie refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = request.cookies.get("snaploop_demo")?.value === "true";

  const hasValidUserSession =
    !!user ||
    (!!userCookie &&
      (() => {
        try {
          const p = JSON.parse(userCookie);
          return (
            typeof p?.id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id)
          );
        } catch {
          return false;
        }
      })());

  const hasAccess = hasValidUserSession || isDemo;

  if (!hasAccess && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasAccess && pathname === "/login") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
