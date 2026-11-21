import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, isUUID } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve the genuine authenticated Supabase user's UUID (user.id)
  let authUserId: string | null = null;
  if (session.user && isUUID(session.user.id)) {
    authUserId = session.user.id;
  } else {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isUUID(user.id)) {
        authUserId = user.id;
      }
    } catch {
      // ignore
    }
  }

  if (!authUserId && session.profile && isUUID(session.profile.id)) {
    authUserId = session.profile.id;
  }

  const userId = authUserId || session.profile.id;
  const username = session.profile.username;

  const formData = await req.formData();
  const caption = formData.get("caption") as string;
  const file = formData.get("image") as File | null;

  let image_url: string | null = null;

  // Handle image upload
  if (file && file.size > 0) {
    // Try Supabase Storage first if user has a real authenticated Supabase UUID
    if (authUserId) {
      try {
        const supabase = await createClient();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${authUserId}/${Date.now()}.${ext}`;
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

    // Fallback: embed as base64 data URL (works cleanly for all session types)
    if (!image_url) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      image_url = `data:${file.type};base64,${base64}`;
    }
  }

  if (!caption && !image_url) {
    return NextResponse.json({ error: "Post must have a caption or image" }, { status: 400 });
  }

  // Try inserting into Supabase DB ONLY when we have a real authenticated Supabase UUID
  if (authUserId) {
    try {
      const supabase = await createClient();

      // Ensure profile row exists first to satisfy foreign key constraint posts_user_id_fkey
      try {
        await supabase.from("profiles").upsert(
          {
            id: authUserId,
            username: session.profile.username,
            full_name: session.profile.full_name || session.profile.username,
            avatar_url: session.profile.avatar_url,
            bio: session.profile.bio,
            created_at: new Date().toISOString(),
            style_prefs: session.profile.style_prefs,
          },
          { onConflict: "id" }
        );
      } catch (err: unknown) {
        console.warn("[Posts] Pre-insert profile auto-heal notice:", err);
      }

      const { data: post, error } = await supabase
        .from("posts")
        .insert({ user_id: authUserId, caption, image_url })
        .select(`*, profiles(*), likes(count), comments(count)`)
        .single();

      if (!error && post) {
        return NextResponse.json({ post: { ...post, user_has_liked: false } });
      }

      // If joined select failed (e.g. profiles table join or RLS), fallback to simple insert
      const { data: simplePost, error: simpleError } = await supabase
        .from("posts")
        .insert({ user_id: authUserId, caption, image_url })
        .select("id, user_id, caption, image_url, created_at")
        .single();

      if (!simpleError && simplePost) {
        return NextResponse.json({
          post: {
            ...simplePost,
            profiles: session.profile,
            likes: [{ count: 0 }],
            comments: [{ count: 0 }],
            user_has_liked: false,
          },
        });
      }

      const finalError = error || simpleError;
      if (finalError) {
        console.error("[Posts] Supabase insert failed (check posts RLS and foreign keys):", finalError);
        return NextResponse.json({
          error: finalError.message,
          message: `Could not save post: ${finalError.message}`,
        }, { status: 500 });
      }
    } catch (error) {
      console.error("[Posts] Unexpected Supabase insert failure:", error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Unexpected database error",
        message: "Could not save post to Supabase. Please try again.",
      }, { status: 500 });
    }
  }

  // Unauthenticated / demo / local-only post:
  // Handled cleanly without sending invalid UUID strings to Supabase!
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

  const authUserId = (session.user && isUUID(session.user.id))
    ? session.user.id
    : (session.profile && isUUID(session.profile.id))
      ? session.profile.id
      : null;

  if (authUserId && isUUID(postId)) {
    try {
      const supabase = await createClient();
      const { data: post } = await supabase
        .from("posts")
        .select("user_id, image_url")
        .eq("id", postId)
        .single();

      if (!post || post.user_id !== authUserId) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }

      if (post.image_url && !post.image_url.startsWith("data:")) {
        const path = post.image_url.split("/posts/")[1];
        if (path) {
          const supabase2 = await createClient();
          await supabase2.storage.from("posts").remove([path]);
        }
      }

      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", authUserId);

      if (deleteError) {
        console.error("[Posts] Supabase delete failed (check posts RLS):", deleteError);
        return NextResponse.json({
          error: deleteError.message,
          message: `Could not delete post: ${deleteError.message}`,
        }, { status: 500 });
      }
    } catch (error) {
      console.error("[Posts] Unexpected delete failure:", error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Unexpected database error",
        message: "Could not delete this post. Please try again.",
      }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
