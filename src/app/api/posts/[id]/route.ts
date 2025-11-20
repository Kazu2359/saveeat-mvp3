import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,title,body,ingredients,media,created_at")
    .eq("id", id)
    .single();

  if (error) {
    console.error("get post error", error);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [likeRes, commentRes] = await Promise.all([
    supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", id),
    supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", id),
  ]);

  const like_count = likeRes.count ?? 0;
  const comment_count = commentRes.count ?? 0;

  return NextResponse.json({ ...data, like_count, comment_count });
}

// 更新（タイトル/説明/材料タグ/メディアを上書き）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { title, description, ingredients, media } = body as {
    title?: string;
    description?: string;
    ingredients?: string[];
    media?: unknown;
  };

  const payload: Record<string, unknown> = {};
  if (typeof title === "string") payload.title = title.trim();
  if (typeof description === "string") payload.body = description.trim();
  if (Array.isArray(ingredients)) payload.ingredients = ingredients;
  if (media !== undefined) payload.media = media;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("update post error", error);
    return NextResponse.json({ error: error.message ?? "failed_to_update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// 削除
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id == "undefined") {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("delete post error", error);
    return NextResponse.json({ error: "failed_to_delete" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
