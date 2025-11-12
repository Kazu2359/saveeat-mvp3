import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type Payload = { title?: string; body?: string; url?: string };
const iso = (d: Date) => d.toISOString().slice(0,10);

// 既存：一人のuserIdに送る
async function sendAllToUser(userId: string, days: number) {
  const admin = createAdminClient();

  // 3日以内の食材をそのユーザー分だけ集計
  const today = new Date();
  const upper = new Date(); upper.setDate(today.getDate() + days);
  const { data: items } = await admin
    .from("pantry_items")
    .select("name, expiry_date, user_id")
    .eq("user_id", userId)
    .not("expiry_date", "is", null)
    .gte("expiry_date", iso(today))
    .lte("expiry_date", iso(upper))
    .order("expiry_date");

  const names = (items ?? []).map(i => i.name);
  const head = names.slice(0,3).join("・");
  const rest = Math.max(0, (names.length||0) - 3);
  const body =
    !names.length ? "期限が近い食材はありません 🍀" :
    rest > 0 ? `${head} など、あと ${rest}件の期限が近いです` :
               `${head} の期限が近いです`;

  const payload: Payload = {
    title: `あと${days}日以内の食材`,
    body,
    url: `/?within=${days}`
  };

  // そのユーザーの購読に送信
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  let sent = 0, removed = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { auth: s.auth, p256dh: s.p256dh } } as any,
        JSON.stringify(payload)
      );
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        removed++;
      }
    }
  }));

  return { sent, removed };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.max(1, Number(url.searchParams.get("days") ?? 3));
  const token = url.searchParams.get("token");

  // ★ 管理トークンが付いていたら「全ユーザー分」を一括送信
  if (token && token === process.env.PUSH_CRON_TOKEN) {
    const admin = createAdminClient();
    const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .not("user_id", "is", null);

  if (subsError) {
  return NextResponse.json({ ok: false, error: subsError.message }, { status: 500 });
    }

// user_id をユニーク化（重複削除）
const users = Array.from(new Set(subs?.map((s) => s.user_id)));

    let total = 0, removed = 0;
    for (const u of users ?? []) {
      const r = await sendAllToUser(u.user_id, days);
      total += r.sent;
      removed += r.removed;
    }
    return NextResponse.json({ ok: true, mode: "cron", days, sent: total, removed });
  }

  // ★ それ以外は「ログイン中の自分宛」(従来通り)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status:401 });

  const { sent, removed } = await sendAllToUser(user.id, days);
  return NextResponse.json({ ok:true, mode: "self", days, sent, removed });
}
