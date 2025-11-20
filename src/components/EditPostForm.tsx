// src/components/EditPostForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/types/post";

export default function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body ?? "");
  const [tags, setTags] = useState((post.ingredients ?? []).join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !post?.id) {
      setError("タイトルまたは投稿IDが不正です");
      return;
    }
    setLoading(true);
    try {
      const ingredients = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: body, ingredients }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "更新に失敗しました");
      router.push(`/posts/${post.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "更新に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSave}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">タイトル</label>
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-inner focus:border-emerald-500 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">説明</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 px-3 py-3 shadow-inner focus:border-emerald-500 focus:outline-none"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="コツやポイント、下味や工程など"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">材料タグ（カンマ区切り）</label>
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-inner focus:border-emerald-500 focus:outline-none"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例: 鶏むね肉, にんじん, じゃがいも"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-white font-semibold shadow hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "更新中..." : "この内容で保存"}
      </button>
      <p className="text-xs text-gray-500">※ メディアの差し替えは今後対応予定です。</p>
    </form>
  );
}
