// src/app/edit/[id]/page.tsx

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditItemForm from "./EditForm";

// ★ Next.js 16 対応：params は Promise<{ id: string }>
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: PageProps) {
  // Promise から id を取り出す
  const { id } = await params;

  const supabase = await createClient();

  // 1) ログインユーザー取得
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect(`/login?next=/edit/${id}`);
  }

  // 2) id + user_id で 1件取得（RLS とダブルチェック）
  const { data, error } = await supabase
    .from("pantry_items")
    .select("id, user_id, name, quantity, expiry_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("edit page fetch error:", error);
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-4 text-2xl font-semibold">食材を編集</h1>
        <p className="mb-2 text-red-500">
          データの取得に失敗しました：{error.message}
        </p>
        <Link href="/" className="text-blue-400 underline">
          在庫一覧に戻る
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-4 text-2xl font-semibold">食材を編集</h1>
        <p className="mb-2 text-red-500">
          データが見つかりませんでした。
        </p>
        <p className="mb-4 text-xs text-gray-400">
          すでに削除されたか、他のユーザーのデータの可能性があります。
        </p>
        <Link href="/" className="text-blue-400 underline">
          在庫一覧に戻る
        </Link>
      </main>
    );
  }

  const initialItem = {
    id: data.id as string,
    name: (data as any).name as string,
    quantity: (data as any).quantity as number,
    expiry_date: (data as any).expiry_date as string | null,
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm underline">
          ← 戻る
        </Link>
        <span className="text-xs text-gray-500">ID: {initialItem.id}</span>
      </div>

      <h1 className="mb-4 text-2xl font-bold">食材を編集</h1>

      <EditItemForm initialItem={initialItem} />
    </main>
  );
}
