export const dynamic = "force-dynamic"; // 確実に再描画させるため一時的に有効

import { createClient } from "@/lib/supabase-server";
import ToastFromSearch from "@/components/ToastFromSearch";
import InventoryListClient, {
  type Item as ClientItem,
} from "@/components/InventoryListClient";
import ExpiryNotifier from "@/components/ExpiryNotifier";
import MealPlanner from "@/components/MealPlanner";
import { deleteItem } from "./inventory/actions";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  // Next.js 16 では searchParams が Promise
  const sp = ((await searchParams) ?? {}) as Record<
    string,
    string | string[] | undefined
  >;

  // 文字列/配列/undefined → 1つの文字列にするヘルパー
  const sv = (v: unknown) =>
    Array.isArray(v)
      ? typeof v[0] === "string"
        ? v[0]
        : ""
      : typeof v === "string"
      ? v
      : "";

  // 🔍 検索キーワード
  const q = sv(sp.q).trim();

  // 「◯日以内」
  const withinRaw = Number(sv(sp.within));
  const within = Number.isFinite(withinRaw) && withinRaw > 0 ? withinRaw : 0;

  // 並び順
  const sort = sv(sp.sort) || "expiry_asc";

  // ✅ チェックボックスの現在の状態（URLそのまま）
  const expiredChecked = sv(sp.expired) === "on";
  const unsetChecked = sv(sp.unset) === "on";

  // ===== Supabase から在庫取得 =====
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <ToastFromSearch />
      <ExpiryNotifier items={items} />

      <h1 className="text-3xl font-bold mb-4 text-gray-800">SaveEat</h1>

      {/* 🔍 検索＆フィルター（GETなのでURLに反映される） */}
      <form
        id="searchForm"
        method="get"
        action="/"
        className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3"
      >
        {/* キーワード */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            食材名で検索
          </label>
          <input
            form="searchForm"
            name="q"
            defaultValue={q}
            placeholder="例：卵、牛乳"
            className="w-full sm:w-64 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* 期限まで◯日以内 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            期限まで
          </label>
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

        {/* 期限ステータスのチェックボックス */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm">
            <input
              form="searchForm"
              type="checkbox"
              name="expired"
              value="on"
              // 🔥 URLに expired=on が付いているときだけチェックON
              defaultChecked={expiredChecked}
            />
            期限切れを含む
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              form="searchForm"
              type="checkbox"
              name="unset"
              value="on"
              defaultChecked={unsetChecked}
            />
            未設定を含む
          </label>
        </div>

        {/* 並び順 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            並び順
          </label>
          <select
            form="searchForm"
            name="sort"
            defaultValue={sort}
            className="border rounded-lg px-2 py-2 text-sm"
          >
            <option value="expiry_asc">期限が近い順</option>
            <option value="expiry_desc">期限が遠い順</option>
            <option value="name_asc">名前順</option>
            <option value="newest">新着順</option>
          </select>
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            form="searchForm"
            type="submit"
            className="px-4 py-2 bg_black bg-black text-white rounded-lg text-sm hover:bg-gray-800"
          >
            適用
          </button>
          <a
            href="/"
            className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            ✖ 全解除
          </a>
        </div>

        <div className="sm:ml-auto text-sm text-gray-600">
          {items.length}件
        </div>
      </form>

      {/* 追加ボタン・メッセージなど */}
      <a
        href={user ? "/add" : "/login"}
        className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
      >
        ＋ 食材を追加
      </a>

      {!user && (
        <p className="mt-6 text-gray-700">
          まずは{" "}
          <a className="underline" href="/login">
            ログイン
          </a>{" "}
          してください。
        </p>
      )}

      {user && items.length === 0 && (
        <p className="mt-6 text-gray-700">
          まだ食材がありません。
          <a className="underline" href="/add">
            最初の1件を追加
          </a>
          しましょう。
        </p>
      )}

            {user && (
        <MealPlanner items={items} />
      )}


      {/* 一覧（フィルター処理は InventoryListClient 側で実施） */}
      {user && items.length > 0 && (
        <div className="mt-6">
          <InventoryListClient items={items} deleteAction={deleteItem} />
        </div>
      )}
    </div>
  );
}
