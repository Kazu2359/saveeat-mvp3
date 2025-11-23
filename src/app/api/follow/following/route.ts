import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId");
  if (!targetId) return NextResponse.json({ error: "userId_required" }, { status: 400 });

  const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", targetId);

  if (error) {
    console.error("following error", error);
    return NextResponse.json({ error: error.message ?? "failed" }, { status: 500 });
  }
  return NextResponse.json({ following: data });
}
