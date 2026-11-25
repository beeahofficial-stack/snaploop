import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, isUUID } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  
  // Resolve genuine authenticated Supabase user UUID (user.id)
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

  if (!authUserId) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "You must be signed in with a valid account to create posts.",
      },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const caption = formData.get("caption") as string;
  const file = formData.get("image") as File | null;

  if (!caption?.trim() && !file) {
    return NextResponse.json(
      { error: "Post must have a caption or image", message: "Post must have a caption or image" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  let image_url: string | null = null;

  // Handle image upload to Supabase Storage
  if (file && file.size > 0) {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${authUserId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.warn("[Posts] Supabase Storage upload notice:", uploadError.message);
        // Fallback to base64 data URL only if bucket upload fails
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        image_url = `data:${file.type};base64,${base64}`;
      } else {
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    } catch (uploadErr) {
      console.warn("[Posts] Image conversion exception:", uploadErr);
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      image_url = `data:${file.type};base64,${base64}`;
    }
  }

  // 1. Ensure profile row exists in public.profiles first (to satisfy posts_user_id_fkey constraint)
  try {
    const username = session.profile?.username || `user_${authUserId.slice(0, 8)}`;
    await supabase.from("profiles").upsert(
      {
        id: authUserId,
        username,
        full_name: session.profile?.full_name || username,
        avatar_url: session.profile?.avatar_url || null,
        bio: session.profile?.bio || "Hey there! I am using SnapLoop 🌱",
        created_at: session.profile?.created_at || new Date().toISOString(),
        style_prefs: session.profile?.style_prefs,
      },
      { onConflict: "id" }
    );
  } catch (err: unknown) {
    console.warn("[Posts] Pre-insert profile auto-heal notice:", err);
  }

  // 2. Insert directly into Supabase posts table
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({ user_id: authUserId, caption: caption?.trim() || null, image_url })
    .select(`*, profiles(*), likes(count), comments(count)`)
    .single();

  if (!insertError && post) {
    return NextResponse.json({ post: { ...post, user_has_liked: false } });
  }

  // If joined select failed (e.g. profiles table join policy), retry with simple insert + select
  const { data: simplePost, error: simpleError } = await supabase
    .from("posts")
    .insert({ user_id: authUserId, caption: caption?.trim() || null, image_url })
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

  // Surface the exact database error clearly instead of falling back to a local object
  const finalError = insertError || simpleError;
  console.error("[Posts] Supabase insert failed:", finalError);
  return NextResponse.json(
    {
      error: finalError?.message || "Failed to save post to database",
      message: `Database error: ${finalError?.message || "Could not save post. Check Supabase RLS policies and table constraints."}`,
    },
    { status: 500 }
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  const authUserId = session.user && isUUID(session.user.id) ? session.user.id : null;

  if (!authUserId) {
    return NextResponse.json({ error: "Unauthorized", message: "Authentication required" }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId || !isUUID(postId)) {
    return NextResponse.json({ error: "Invalid post ID", message: "Post ID must be a valid UUID" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: post, error: findError } = await supabase
      .from("posts")
      .select("user_id, image_url")
      .eq("id", postId)
      .single();

    if (findError || !post) {
      return NextResponse.json({ error: "Post not found", message: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden", message: "You can only delete your own posts" }, { status: 403 });
    }

    if (post.image_url && !post.image_url.startsWith("data:")) {
      const path = post.image_url.split("/posts/")[1];
      if (path) {
        try {
          const supabase2 = await createClient();
          await supabase2.storage.from("posts").remove([path]);
        } catch {}
      }
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", authUserId);

    if (deleteError) {
      console.error("[Posts] Supabase delete failed:", deleteError);
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

  return NextResponse.json({ success: true });
}
