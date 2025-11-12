"use client";

import { useTransition } from "react";
import { deleteItem } from "./actions";

export default function ItemDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    const ok = window.confirm("このアイテムを削除します。よろしいですか？");
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteItem(id);
      // 簡易トースト（Toasterコンポーネントに通知）
      window.dispatchEvent(
        new CustomEvent("toast", { detail: res.ok ? "削除しました！" : res.message })
      );
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      title="削除"
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "削除中..." : "🗑️ 削除"}
    </button>
  );
}
