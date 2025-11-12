import { createClient } from "@/lib/supabase-server";
import ItemDeleteButton from "./ItemDeleteButton";
import Toaster from "./Toaster";

type Item = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  expires_on: string | null;
  note: string | null;
  created_at: string;
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-6">ログインしてください。</main>;

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <main className="p-6">読み込みに失敗しました：{error.message}</main>;

  const items = (data ?? []) as Item[];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">在庫一覧</h1>

      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm opacity-80">
                  {it.qty} {it.unit}
                  {it.expires_on ? ` ／ 期限: ${it.expires_on}` : ""}
                  {it.note ? ` ／ メモ: ${it.note}` : ""}
                </div>
              </div>

              {/* ✏️ 削除 */}
              <ItemDeleteButton id={it.id} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="opacity-70">まだ登録がありません。</p>}
      </div>

      {/* 通知 */}
      <Toaster />
    </main>
  );
}
