// src/app/add/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AddForm from "./AddForm";

export default async function AddPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔐 未ログインならログイン画面へ
  if (!user) {
    redirect("/login?next=/add");
  }

  // ログイン済みならフォームを表示（user.id を渡す）
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">食材を追加</h1>
      <AddForm userId={user.id} />
    </main>
  );
}
