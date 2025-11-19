"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function EditForm({
  id,
  initialName,
  initialQuantity,
  initialExpiry,
}: {
  id: string;
  initialName: string;
  initialQuantity: number;
  initialExpiry: string | null;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const [expiry, setExpiry] = useState(initialExpiry ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const q = Number(quantity);
    if (!name.trim()) return setErr("食材名は必須です");
    if (!Number.isInteger(q) || q <= 0)
      return setErr("数量は1以上の整数にしてください");

    setLoading(true);
    const t = toast.loading("更新中…");

    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({
          name: name.trim(),
          quantity: q,
          expiry_date: expiry || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("更新しました！", { id: t });
      router.push("/");
    } catch (e: any) {
      toast.error(e?.message || "更新に失敗しました", { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1">食材名</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1">数量</label>
        <input
          className="w-full border px-3 py-2 rounded"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-1">期限（任意）</label>
        <input
          className="w-full border px-3 py-2 rounded"
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
      </div>

      {err && <p className="text-red-500">{err}</p>}

      <button
        className="bg-black text-white rounded px-4 py-2 w-full"
        disabled={loading}
      >
        {loading ? "更新中…" : "保存する"}
      </button>
    </form>
  );
}
