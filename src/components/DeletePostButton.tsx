"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function DeletePostButton({
  postId,
  postTitle,
  redirectTo,
}: {
  postId: string;
  postTitle?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const label = postTitle ? `「${postTitle}」` : "この投稿";
    const ok = window.confirm(`${label}を削除します。よろしいですか？`);
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error ?? "削除に失敗しました");
        }

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "削除に失敗しました";
        setError(message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {isPending ? "削除中..." : "🗑️ 投稿を削除"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
