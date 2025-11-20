import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";

// GET /api/posts - list recent posts
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,title,body,ingredients,media,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("list posts error", error);
    return NextResponse.json({ error: "failed_to_list" }, { status: 500 });
  }

  const posts = data as Post[];
  return NextResponse.json({ posts });
}

// POST /api/posts - create a post
export async function POST(req: Request) {
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
    media?: Post["media"];
  };

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }
  if (!media || media.length === 0) {
    return NextResponse.json({ error: "media_required" }, { status: 400 });
  }

  const { error: insertErr, data } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: title.trim(),
      body: description?.trim() ?? "",
      ingredients: ingredients ?? [],
      media,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("create post error", insertErr);
    return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
