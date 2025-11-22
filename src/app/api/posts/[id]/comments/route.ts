import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,body,created_at,user_id")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("comments error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ comments: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.text || !body.text.trim()) {
    return NextResponse.json({ error: "body_required" }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: id,
      user_id: user.id,
      body: body.text.trim(),
    })
    .select("id,body,created_at,user_id")
    .single();
  if (error || !inserted) {
    console.error("comment error", error);
    return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, comment: inserted });
}
