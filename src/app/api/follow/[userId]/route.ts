import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  if (!userId || userId === user.id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const { error } = await supabase.from("follows").insert({ follower_id: user.id, followee_id: userId });
  if (error) {
    console.error("follow error", error);
    return NextResponse.json({ error: error.message ?? "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  if (!userId) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", userId);
  if (error) {
    console.error("unfollow error", error);
    return NextResponse.json({ error: error.message ?? "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
