// src/app/api/items/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type RouteParams = { params: { id: string } };

// 更新（編集）
export async function PATCH(req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const id = params.id;
  const body = await req.json();
  const { name, quantity, expiry_date } = body;

  const { error } = await supabase
    .from("pantry_items")
    .update({
      name,
      quantity,
      expiry_date: expiry_date || null,
    })
    .eq("id", id)
    .eq("user_id", user.id); // 自分のレコードだけ

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "更新に失敗しました。" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

// 削除
export async function DELETE(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const id = params.id;

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "削除に失敗しました。" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
