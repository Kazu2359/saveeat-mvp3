// src/components/DeleteButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました");
      }

      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
    >
      🗑️ 削除
    </button>
  );
}
