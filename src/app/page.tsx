export const dynamic = "force-dynamic"; // 確実に再描画させるため一時的に有効

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ToastFromSearch from "@/components/ToastFromSearch";
import InventoryListClient, { type Item as ClientItem } from "@/components/InventoryListClient";
import ExpiryNotifier from "@/components/ExpiryNotifier";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
};

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function badgeClass(days: number | null) {
  if (days === null) return "bg-gray-300 text-gray-800";
  if (days <= 3) return "bg-red-500 text-white";
  if (days <= 7) return "bg-yellow-400 text-black";
  return "bg-green-500 text-white";
}

/** 🗑️ 削除 → /?toast=deleted にリダイレクト（トースト合図） */
export async function deleteItem(id: string) {
  "use server";
  const supabase = await createClient();
  await supabase.from("pantry_items").delete().eq("id", id);
  redirect("/?toast=deleted");
}

/** ⬇⬇ ここが重要：searchParams を必ず受け取る ⬇⬇ */
export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();

  // ✅ 文字列/配列/undefined どれでも安全に1つの文字列へするヘルパ
  const sv = (v: unknown) =>
    Array.isArray(v) ? (typeof v[0] === "string" ? v[0] : "") : (typeof v === "string" ? v : "");

  const q = sv(searchParams?.q).trim();

  const withinRaw = Number(sv(searchParams?.within));
  const within = Number.isFinite(withinRaw) && withinRaw > 0 ? withinRaw : 0;

  const includeExpired = sv(searchParams?.expired) === "on";
  const includeUnset   = sv(searchParams?.unset)   === "on";
  const sort           = sv(searchParams?.sort) || "expiry_asc";

  const { data: { user } } = await supabase.auth.getUser();

  let items: ClientItem[] = [];
if (user) {
  const { data } = await supabase
    .from("pantry_items")
    .select("id, name, quantity, unit, expiry_date")
    .order("expiry_date", { ascending: true, nullsFirst: false });
  items = (data as ClientItem[] | null) ?? [];
}

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">

     {/* ★ これを一番上に置くだけ */}
      <ToastFromSearch />
      <ExpiryNotifier items={items} />
      <h1 className="text-3xl font-bold mb-4 text-gray-800">SaveEat</h1>

      {/* 🔍 検索＆フィルター（GETなのでURLに反映されます） */}
<form
  id="searchForm"
  method="get"
  action="/"
  className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3"
>
  <div>
    <label className="block text-sm font-medium text-gray-700">食材名で検索</label>
    <input
      form="searchForm"
      name="q"
      defaultValue={q}
      placeholder="例：卵、牛乳"
      className="w-full sm:w-64 border rounded-lg px-3 py-2 text-sm"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">期限まで</label>
    <div className="flex items-center gap-2">
      <input
        form="searchForm"
        type="number"
        name="within"
        min={0}
        defaultValue={within || ""}
        placeholder="日数"
        className="w-20 border rounded-lg px-2 py-2 text-sm"
      />
      <span className="text-sm">日以内</span>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <label className="flex items-center gap-1 text-sm">
      <input form="searchForm" type="checkbox" name="expired" defaultChecked={includeExpired} />
      期限切れを含む
    </label>
    <label className="flex items-center gap-1 text-sm">
      <input form="searchForm" type="checkbox" name="unset" defaultChecked={includeUnset} />
      未設定を含む
    </label>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">並び順</label>
    <select form="searchForm" name="sort" defaultValue={sort} className="border rounded-lg px-2 py-2 text-sm">
      <option value="expiry_asc">期限が近い順</option>
      <option value="expiry_desc">期限が遠い順</option>
      <option value="name_asc">名前順</option>
      <option value="newest">新着順</option>
    </select>
  </div>

  <div className="flex gap-2">
    {/* form属性でこのボタンが searchForm を送ることを明示 */}
    <button form="searchForm" type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
      適用
    </button>
    <a href="/" className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
      ✖ 全解除
    </a>
  </div>

  <div className="sm:ml-auto text-sm text-gray-600">{items.length}件</div>
</form>



      <a
        href={user ? "/add" : "/login"}
        className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
      >
        ＋ 食材を追加
      </a>

      {!user && (
        <p className="mt-6 text-gray-700">
          まずは <a className="underline" href="/login">ログイン</a> してください。
        </p>
      )}

      {user && items.length === 0 && (
        <p className="mt-6 text-gray-700">
          まだ食材がありません。<a className="underline" href="/add">最初の1件を追加</a>しましょう。
        </p>
      )}

      {/* ここを差し替え：クライアント側で searchParams を読みフィルタ */}
      <InventoryListClient items={items} deleteAction={deleteItem} />

    </div>
  );
}
