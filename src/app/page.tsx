export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import ToastFromSearch from "@/components/ToastFromSearch";
import InventoryListClient, { type Item as ClientItem } from "@/components/InventoryListClient";
import ExpiryNotifier from "@/components/ExpiryNotifier";
import MealPlanner from "@/components/MealPlanner";
import { deleteItem } from "./inventory/actions";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const sp = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;

  const sv = (v: unknown) => (Array.isArray(v) ? (typeof v[0] === "string" ? v[0] : "") : typeof v === "string" ? v : "");
  const q = sv(sp.q).trim();
  const withinRaw = Number(sv(sp.within));
  const within = Number.isFinite(withinRaw) && withinRaw > 0 ? withinRaw : 0;
  const sort = sv(sp.sort) || "expiry_asc";
  const expiredChecked = sv(sp.expired) === "on";
  const unsetChecked = sv(sp.unset) === "on";

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
    <div className="min-h-screen bg-gradient-to-b from-[#e9eef3] via-[#f2f4f7] to-[#f6f7f9] text-gray-900">
      <ToastFromSearch />
      <ExpiryNotifier items={items} />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 px-6 py-10 shadow-xl text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">SaveEat</p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">冷蔵庫の食材をスマート管理</h1>
              <p className="max-w-2xl text-sm text-emerald-100">
                在庫管理と賞味期限をひと目で。AIがある食材から献立を提案し、節約＆時短をサポートします。
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={user ? "/upload" : "/login"}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold !text-emerald-700 shadow hover:scale-105 transition"
              >
                投稿する（新機能）
              </Link>
              <Link
                href={user ? "/add" : "/login"}
                className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold !text-white hover:bg-white/10 transition"
              >
                食材を追加
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur">
          <h2 className="text-xl font-semibold text-gray-900">検索とフィルター</h2>
          <form id="searchForm" method="get" action="/" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">食材名で検索</label>
              <input
                form="searchForm"
                name="q"
                defaultValue={q}
                placeholder="例：卵、牛乳"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">期限まで</label>
              <div className="flex items-center gap-2">
                <input
                  form="searchForm"
                  type="number"
                  name="within"
                  min={0}
                  defaultValue={within || ""}
                  placeholder="日数"
                  className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-sm text-gray-600">日以内</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">並び順</label>
              <select
                form="searchForm"
                name="sort"
                defaultValue={sort}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              >
                <option value="expiry_asc">期限が近い順</option>
                <option value="expiry_desc">期限が遠い順</option>
                <option value="name_asc">名前順</option>
                <option value="newest">新着順</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    form="searchForm"
                    type="checkbox"
                    name="expired"
                    value="on"
                    defaultChecked={expiredChecked}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  期限切れを含む
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    form="searchForm"
                    type="checkbox"
                    name="unset"
                    value="on"
                    defaultChecked={unsetChecked}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  未設定を含む
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  form="searchForm"
                  type="submit"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                >
                  適用
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  ✕ 全解除
                </Link>
                <span className="text-sm text-gray-600">{items.length}件</span>
              </div>
            </div>
          </form>
        </section>

        <section className="grid gap-4 rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">在庫</h2>
            <Link
              href={user ? "/add" : "/login"}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold !text-white shadow hover:bg-gray-900"
            >
              ＋ 食材を追加
            </Link>
          </div>

          {!user && (
            <p className="text-gray-700">
              まずは <Link className="underline" href="/login">ログイン</Link> してください。
            </p>
          )}

          {user && items.length === 0 && (
            <p className="text-gray-700">
              まだ食材がありません。<Link className="underline" href="/add">最初の1件を追加</Link> しましょう。
            </p>
          )}

          {user && items.length > 0 && (
            <div className="mt-2">
              <InventoryListClient items={items} deleteAction={deleteItem} />
            </div>
          )}
        </section>

        {user && <MealPlanner items={items} />}
      </div>
    </div>
  );
}
