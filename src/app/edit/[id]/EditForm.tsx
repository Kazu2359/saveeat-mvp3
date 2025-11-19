// src/app/edit/[id]/EditItemForm.tsx

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  initialItem: {
    id: string;
    name: string;
    quantity: number;
    expiry_date: string | null;
  };
};

export default function EditItemForm({ initialItem }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialItem.name ?? "");
  const [quantity, setQuantity] = useState<string>(
    String(initialItem.quantity ?? 1)
  );
  const [expiry, setExpiry] = useState<string>(initialItem.expiry_date ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dateRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) return setErr("食材名は必須です");
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) {
      return setErr("数量は1以上の整数にしてください");
    }
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      return setErr("日付の形式が正しくありません（YYYY-MM-DD）");
    }

    setLoading(true);
    const t = toast.loading("更新中…");

    try {
      const res = await fetch(`/api/items/${initialItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          // サーバー側では quantity / expiry_date など
          // route.ts の実装に合わせて key 名を揃えてください
          quantity: q,
          expiry_date: expiry || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          body?.error ?? "更新に失敗しました。もう一度お試しください。";
        throw new Error(msg);
      }

      toast.success("更新しました！", { id: t });
      router.push("/");
    } catch (e: any) {
      const msg =
        e?.message ?? "更新に失敗しました。もう一度お試しください。";
      setErr(msg);
      toast.error(msg, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      {err && (
        <p className="mb-3 text-sm text-red-600">
          {err}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">食材名 *</label>
        <input
          className="w-full rounded-2xl border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">数量 *</label>
        <input
          className="w-full rounded-2xl border px-3 py-2"
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          消費期限（任意）
        </label>
        <div className="relative">
          <input
            ref={dateRef}
            className="w-full rounded-2xl border px-3 py-2 [appearance:auto]"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            onFocus={(e) => (e.currentTarget as any).showPicker?.()}
          />
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker?.()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-sm underline"
          >
            開く
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          未入力でもOK。入力すると期限バッジに反映されます。
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-black px-4 py-2 text-white transition-opacity disabled:opacity-60"
      >
        {loading ? "更新中…" : "保存する"}
      </button>
    </form>
  );
}
