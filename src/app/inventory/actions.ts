"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function deleteItem(id: string) {
  if (!id) return { ok: false, message: "IDが不正です。" };

  const supabase = await createClient();
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) return { ok: false, message: "ログインが必要です。" };

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { ok: false, message: `削除に失敗：${error.message}` };

  revalidatePath("/inventory");
  return { ok: true, message: "削除しました！" };
}
