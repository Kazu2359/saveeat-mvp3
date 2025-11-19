// src/app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// ★ Next.js 16 対応：params は Promise<{ id: string }>
type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH /api/items/[id] : 食材を更新
export async function PATCH(req: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;

  const supabase = await createClient();

  // 1) ログインユーザー確認（ここで user が取れなければ 401 で返す）
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2) body をパースして、更新に使うフィールドだけ取り出す
  const body = await req.json().catch(() => ({}));

  const updateData: {
    name?: string;
    quantity?: number;
    expiry_date?: string | null;
  } = {};

  if (typeof body.name === "string") {
    updateData.name = body.name;
  }

  if (typeof body.quantity === "number") {
    updateData.quantity = body.quantity;
  }

  // null or 'YYYY-MM-DD' だけ許可
  if (body.expiry_date === null || typeof body.expiry_date === "string") {
    updateData.expiry_date = body.expiry_date;
  }

  // 3) 自分のレコードだけ更新（id + user_id で絞る）
  const { error } = await supabase
    .from("pantry_items")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

// （DELETE をここで使わないなら、export しなくてOK）
