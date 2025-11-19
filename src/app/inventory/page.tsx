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

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  // 🔥 Next.js 16 では searchParams が Promise になる想定なのでこうしておく
  searchParams?: Promise<SearchParams>;
};

export default async function InventoryPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="p-6">ログインしてください。</main>;
  }

  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-6">
        読み込みに失敗しました：{error.message}
      </main>
    );
  }

  const allItems = (data ?? []) as Item[];

  // ====== URLクエリ → そのまま状態にする ======
  let sp: SearchParams = {};

  // 🔥 searchParams は Promise かもしれないので await で中身を取り出す
  if (searchParams) {
    const resolved = await searchParams;
    sp = resolved ?? {};
  }

  // キーワード
  const qParam = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (qParam ?? "").trim();

  // 期限切れ / 未設定 のチェック状態
  const expiredParam = Array.isArray(sp.expired)
    ? sp.expired[0]
    : sp.expired;
  const unsetParam = Array.isArray(sp.unset)
    ? sp.unset[0]
    : sp.unset;

  const includeExpired = expiredParam === "on"; // 「期限切れを含める」
  const includeUnset = unsetParam === "on"; // 「未設定を含める」
  const hasStatusFilter = includeExpired || includeUnset;

  // 期限まで◯日以内
  const withinParam = Array.isArray(sp.within)
    ? sp.within[0]
    : sp.within;
  const within =
    withinParam && withinParam !== "" ? Number(withinParam) : null;

  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  // ====== フィルター適用 ======
  let items = allItems;

  // ① キーワード
  if (q) {
    const qLower = q.toLowerCase();
    items = items.filter((it) => it.name.toLowerCase().includes(qLower));
  }

  // ② 期限まで◯日以内
  if (within !== null && Number.isFinite(within) && within > 0) {
    const upper = new Date();
    upper.setDate(upper.getDate() + within);
    const upperISO = upper.toISOString().slice(0, 10);

    items = items.filter((it) => {
      // 期限未設定は「期限日では絞らない」＝そのまま残す
      if (!it.expires_on) return true;
      return it.expires_on <= upperISO;
    });
  }

  // ③ 期限ステータス（チェックがあるときだけ発動）
  if (hasStatusFilter) {
    items = items.filter((it) => {
      const isUnset = it.expires_on === null;
      const isExpired =
        it.expires_on !== null && it.expires_on < todayISO;

      if (includeUnset && isUnset) return true;
      if (includeExpired && isExpired) return true;

      // チェックされてないものは除外
      return false;
    });
  }
  // ※ 両方チェックなし → hasStatusFilter=false → ここはスキップ
  //    → ステータスで絞らない（全部表示）

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">在庫一覧</h1>

      {/* 🔍 フィルタUI：チェック状態 = URLそのまま */}
      <form
        method="GET"
        className="mb-4 flex flex-wrap items-center gap-3 text-sm"
      >
        <label className="flex items-center gap-1">
          <span>キーワード:</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            className="border rounded px-2 py-1 text-sm"
            placeholder="名前で検索"
          />
        </label>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="expired"
            value="on"
            defaultChecked={includeExpired}
            className="h-4 w-4"
          />
          <span>期限切れを含める</span>
        </label>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="unset"
            value="on"
            defaultChecked={includeUnset}
            className="h-4 w-4"
          />
          <span>期限未設定を含める</span>
        </label>

        <label className="flex items-center gap-1">
          <span>◯日以内:</span>
          <input
            type="number"
            name="within"
            min={1}
            defaultValue={within ?? ""}
            className="border rounded px-2 py-1 w-20 text-sm"
          />
        </label>

        <button
          type="submit"
          className="ml-auto rounded bg-blue-600 px-3 py-1 text-white text-sm hover:bg-blue-700"
        >
          適用
        </button>
      </form>

      <div className="mb-2 text-sm text-gray-600">{items.length}件表示中</div>

      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm opacity-80">
                  {it.qty} {it.unit}
                  {it.expires_on
                    ? ` ／ 期限: ${it.expires_on}`
                    : " ／ 期限: なし"}
                  {it.note ? ` ／ メモ: ${it.note}` : ""}
                </div>
              </div>

              <ItemDeleteButton id={it.id} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="opacity-70">まだ登録がありません。</p>
        )}
      </div>

      <Toaster />
    </main>
  );
}
