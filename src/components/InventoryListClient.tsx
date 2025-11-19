"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
};

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(t / (1000 * 60 * 60 * 24));
}

function badgeClass(days: number | null) {
  if (days === null) return "bg-gray-300 text-gray-800";
  if (days <= 3) return "bg-red-500 text-white";
  if (days <= 7) return "bg-yellow-400 text-black";
  return "bg-green-500 text-white";
}

type DeleteResult = { ok: boolean; message: string };

export default function InventoryListClient({
  items,
  deleteAction,
}: {
  items: Item[];
  deleteAction: (id: string) => Promise<DeleteResult>;
}) {
  const sp = useSearchParams();

  // 検索キーワード
  const q = (sp.get("q") ?? "").trim();

  // チェックボックスの状態
  const includeExpired = sp.get("expired") === "on"; // 期限切れを含む
  const includeUnset = sp.get("unset") === "on"; // 未設定を含む

  // 期限まで◯日以内
  const withinParam = sp.get("within");
  const within =
    withinParam && withinParam !== "" ? Number(withinParam) : null;

  // 並び順
  const sort = sp.get("sort") ?? "expiry_asc";

  // --- フィルタ（クライアント側） ---
  let filtered = items;

  // ① キーワード検索
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter((it) =>
      it.name.toLowerCase().includes(qLower)
    );
  }

  // ② 期限・ステータスのフィルタ（ベース＋含む）
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  let upperISO: string | null = null;
  if (within !== null && Number.isFinite(within) && within > 0) {
    const upper = new Date();
    upper.setDate(upper.getDate() + within);
    upperISO = upper.toISOString().slice(0, 10);
  }

  filtered = filtered.filter((it) => {
    const isUnset = it.expiry_date === null;
    const expiryStr = it.expiry_date ?? "";
    const isExpired = !isUnset && expiryStr < todayISO;
    let isValid = !isUnset && !isExpired; // 期限が設定されていて、まだ切れていない

    // 「◯日以内」が指定されているときは、期限があるものだけ上限チェック
    if (upperISO && isValid) {
      if (expiryStr > upperISO) {
        isValid = false;
      }
    }

    // ベース：期限内のもの（isValid）は常に表示
    let visible = isValid;

    // 期限切れを「含む」にチェック → 期限切れも表示対象に追加
    if (isExpired && includeExpired) {
      visible = true;
    }

    // 未設定を「含む」にチェック → 未設定も表示対象に追加
    if (isUnset && includeUnset) {
      visible = true;
    }

    // 未設定チェック OFF のときは、未設定は visible にされない
    // 期限切れチェック OFF のときは、期限切れは visible にされない

    return visible;
  });

  // ③ 並び順
  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case "expiry_desc":
        return (b.expiry_date ?? "9999-12-31") >
          (a.expiry_date ?? "9999-12-31")
          ? 1
          : -1;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "newest":
        // ここでは「期限が新しい順」として扱う
        return (b.expiry_date ?? "9999-12-31") >
          (a.expiry_date ?? "9999-12-31")
          ? 1
          : -1;
      default:
        // expiry_asc（期限が近い順）
        return (a.expiry_date ?? "9999-12-31") >
          (b.expiry_date ?? "9999-12-31")
          ? 1
          : -1;
    }
  });

  // 削除ボタン用ハンドラ
  const handleDeleteClick = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const res = await deleteAction(id);
      if (typeof window !== "undefined" && res?.message) {
        window.showToast(res.message);
      }
    } catch {
      if (typeof window !== "undefined") {
        window.showToast("削除中にエラーが発生しました。");
      }
    }
  };

  return (
    <>
      <div className="sm:ml-auto text-sm text-gray-600 mb-2">
        {filtered.length}件
      </div>

      <ul className="mt-2 space-y-2">
        {filtered.map((item) => {
          const d = daysLeft(item.expiry_date);
          return (
            <li
              key={item.id}
              className="border border-gray-300 rounded p-3 bg-white shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">
                  {item.quantity} {item.unit ?? ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${badgeClass(d)}`}>
                  {item.expiry_date
                    ? d! < 0
                      ? `期限切れ ${Math.abs(d!)}日😭`
                      : `残り${d}日`
                    : "期限未設定"}
                </span>

                <Link
                  href={`/edit/${item.id}`}
                  className="text-xs text-blue-600 underline hover:text-blue-800"
                >
                  📝編集
                </Link>

                <button
                  type="button"
                  className="text-xs text-red-600 underline hover:text-red-800"
                  onClick={() => handleDeleteClick(item.id)}
                >
                  🗑️削除
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
