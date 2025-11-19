import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// 更新時に受け取る可能性のある項目
type UpdateBody = {
  name?: string;
  qty?: number;
  unit?: string;
  expires_on?: string | null;
  note?: string | null;
};

// 🔹 アイテム更新（PATCH /api/items/[id]）
export async function PATCH(req: any, context: any) {
  const { params } = await context;
  const { id } = params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pantry_items")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// 🔹 アイテム削除（DELETE /api/items/[id]）
export async function DELETE(req: any, context: any) {
  const { params } = await context;
  const { id } = params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
