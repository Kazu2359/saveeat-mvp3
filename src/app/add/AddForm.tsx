// src/app/add/AddForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AddForm({ userId }: { userId: string }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) {
      setErr("食材名は必須です");
      return;
    }

    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) {
      setErr("数量は1以上の整数にしてください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: q,
          expiry_date: expiry ? formatDateYYYYMMDD(expiry) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "保存に失敗しました");
      }

      router.push("/");
    } catch (e: any) {
      setErr(e?.message ?? "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">食材名 *</label>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="例：banana"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">数量 *</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          消費期限（任意）
        </label>
        <div className="w-full">
          <DatePicker
            selected={expiry}
            onChange={(d) => setExpiry(d)}
            dateFormat="yyyy-MM-dd"
            placeholderText="クリックして選択"
            className="w-full rounded border px-3 py-2"
            isClearable
            minDate={new Date()}
            showPopperArrow={false}
            todayButton="今日"
          />
        </div>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {loading ? "保存中…" : "追加する"}
      </button>
    </form>
  );
}
