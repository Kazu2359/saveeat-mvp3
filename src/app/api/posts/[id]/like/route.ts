import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { error } = await supabase.from("post_likes").upsert(
    { post_id: id, user_id: user.id },
    { onConflict: "post_id,user_id" }
  );
  if (error) {
    console.error("like error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("unlike error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
