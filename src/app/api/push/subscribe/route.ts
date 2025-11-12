import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Web Push の Subscription JSON を受け取る
  const sub = await req.json();

  const rawKey  = sub.keys?.p256dh;
  const rawAuth = sub.keys?.auth;

  // すでに base64url → btoa 要らないためそのまま保存でOK
  const p256dh = rawKey;
  const auth   = rawAuth;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" } // 同一 endpoint は上書き
  );

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
