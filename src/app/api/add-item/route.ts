// src/app/api/add-item/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "ログインが必要です。" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name, quantity, expiry_date } = body;

  if (!name || !quantity) {
    return NextResponse.json(
      { error: "食材名と数量は必須です。" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    name,
    quantity,
    expiry_date: expiry_date || null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "保存に失敗しました。" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
