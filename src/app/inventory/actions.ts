"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function deleteItem(id: string) {
  if (!id) {
    const cookieStore = await cookies();
    cookieStore.set("toast", "IDが不正です。", {
      path: "/",
      maxAge: 5,
    });
    return { ok: false, message: "IDが不正です。" };
  }

  const supabase = await createClient();

  // ログイン確認
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    const cookieStore = await cookies();
    cookieStore.set("toast", "ログインが必要です。", {
      path: "/",
      maxAge: 5,
    });
    return { ok: false, message: "ログインが必要です。" };
  }

  // 実際の削除
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  const cookieStore = await cookies();

  if (error) {
    const msg = `削除に失敗しました: ${error.message}`;
    cookieStore.set("toast", msg, {
      path: "/",
      maxAge: 5,
    });
    return { ok: false, message: msg };
  }

  // ★ 成功時トースト
  const msg = "削除しました！";
  cookieStore.set("toast", msg, {
    path: "/",
    maxAge: 5,
  });

  // 一覧を更新
  revalidatePath("/");

  return { ok: true, message: msg };
}
