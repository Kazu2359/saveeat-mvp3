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

export default function InventoryListClient({
  items,
  deleteAction,
}: {
  items: Item[];
  deleteAction: (id: string) => void | Promise<void>;
}) {
  const sp = useSearchParams();

  const q = (sp.get("q") ?? "").trim();
  const within = Number(sp.get("within") ?? "");
  const includeExpired = sp.get("expired") === "on";
  const includeUnset = sp.get("unset") === "on";
  const sort = sp.get("sort") ?? "expiry_asc";

  // --- フィルタ（クライアント側） ---
  let filtered = items;

  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter((it) => it.name.toLowerCase().includes(qLower));
  }

  if (!includeUnset) {
    filtered = filtered.filter((it) => it.expiry_date !== null);
  }

  if (!includeExpired) {
    const todayISO = new Date().toISOString().slice(0, 10);
    filtered = filtered.filter(
      (it) => it.expiry_date === null || it.expiry_date >= todayISO
    );
  }

  if (Number.isFinite(within) && within > 0) {
    const upper = new Date();
    upper.setDate(upper.getDate() + within);
    const upperISO = upper.toISOString().slice(0, 10);
    filtered = filtered.filter(
      (it) => it.expiry_date !== null && it.expiry_date <= upperISO
    );
  }

  // --- 並び順 ---
  filtered = [...filtered].sort((a, b) => {
    switch (sort) {
      case "expiry_desc":
        return (b.expiry_date ?? "9999") > (a.expiry_date ?? "9999") ? 1 : -1;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "newest":
        // created_at は持ってない想定なので expiry_dateの降順で代替
        return (b.expiry_date ?? "9999") > (a.expiry_date ?? "9999") ? 1 : -1;
      default:
        // expiry_asc
        return (a.expiry_date ?? "9999") > (b.expiry_date ?? "9999") ? 1 : -1;
    }
  });

  return (
    <>
      <div className="sm:ml-auto text-sm text-gray-600 mb-2">{filtered.length}件</div>

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
                      ? `期限切れ ${Math.abs(d!)}日`
                      : `残り${d}日`
                    : "期限未設定"}
                </span>

                <Link
                  href={`/edit/${item.id}`}
                  className="text-xs text-blue-600 underline hover:text-blue-800"
                >
                  📝編集
                </Link>

                <form
                  action={async () => {
                    // Server Action を呼ぶ
                    await deleteAction(item.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline hover:text-red-800"
                    onClick={(e) => {
                      if (!confirm("本当に削除しますか？")) e.preventDefault();
                    }}
                  >
                    🗑️削除
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
