import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_GUEST_PROFILE, SNAPLOOP_DEMO_COOKIE, SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(SNAPLOOP_DEMO_COOKIE, "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set(SNAPLOOP_USER_COOKIE, JSON.stringify(DEFAULT_GUEST_PROFILE), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, profile: DEFAULT_GUEST_PROFILE });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SNAPLOOP_DEMO_COOKIE);
  cookieStore.delete(SNAPLOOP_USER_COOKIE);
  return NextResponse.json({ ok: true });
}
