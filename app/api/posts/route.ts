import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { SNAPLOOP_USER_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.profile.id;
  const username = session.profile.username;

  const formData = await req.formData();
  const caption = formData.get("caption") as string;
  const file = formData.get("image") as File | null;

  let image_url: string | null = null;

  // Handle image upload
  if (file && file.size > 0) {
    // Try Supabase Storage first (for real authenticated users)
    if (session.user) {
      try {
        const supabase = await createClient();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
          image_url = urlData.publicUrl;
        }
      } catch {
        // Fall through to base64 fallback
      }
    }

    // Fallback: embed as base64 data URL (works for all session types)
    if (!image_url) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      image_url = `data:${file.type};base64,${base64}`;
    }
  }

  if (!caption && !image_url) {
    return NextResponse.json({ error: "Post must have a caption or image" }, { status: 400 });
  }

  // Try inserting into Supabase DB
  if (session.user) {
    try {
      const supabase = await createClient();
      const { data: post, error } = await supabase
        .from("posts")
        .insert({ user_id: userId, caption, image_url })
        .select(`*, profiles(*), likes(count), comments(count)`)
        .single();

      if (!error && post) {
        return NextResponse.json({ post: { ...post, user_has_liked: false } });
      }
    } catch {
      // Fall through to local-only post
    }
  }

  // Local-only post (cookie session / demo) — return a valid post object
  const localPost = {
    id: `local_${Date.now()}`,
    user_id: userId,
    caption: caption || null,
    image_url,
    created_at: new Date().toISOString(),
    profiles: {
      id: userId,
      username,
      full_name: session.profile.full_name,
      avatar_url: session.profile.avatar_url,
      bio: session.profile.bio,
      created_at: session.profile.created_at,
      style_prefs: session.profile.style_prefs,
    },
    likes: [{ count: 0 }],
    comments: [{ count: 0 }],
    user_has_liked: false,
  };

  return NextResponse.json({ post: localPost });
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json();

  if (session.user) {
    try {
      const supabase = await createClient();
      const { data: post } = await supabase
        .from("posts")
        .select("user_id, image_url")
        .eq("id", postId)
        .single();

      if (!post || post.user_id !== session.user.id) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }

      if (post.image_url && !post.image_url.startsWith("data:")) {
        const path = post.image_url.split("/posts/")[1];
        if (path) {
          const supabase2 = await createClient();
          await supabase2.storage.from("posts").remove([path]);
        }
      }

      await supabase.from("posts").delete().eq("id", postId);
    } catch {
      // best effort
    }
  }

  return NextResponse.json({ success: true });
}
