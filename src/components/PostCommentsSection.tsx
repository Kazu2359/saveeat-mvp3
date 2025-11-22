"use client";

import { useEffect, useRef, useState } from "react";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function PostCommentsSection({
  postId,
  onCountSync,
  inputRef,
  initialComments,
}: {
  postId: string;
  onCountSync?: (count: number) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  initialComments?: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [loading, setLoading] = useState(!initialComments);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "failed");
        setComments(json.comments ?? []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "コメントの取得に失敗しました";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (onCountSync) onCountSync(comments.length);
  }, [comments, onCountSync]);

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "コメント送信に失敗しました");

      if (json.comment) {
        // optimistic append to avoid extra round trips
        setComments((prev) => [...prev, json.comment as Comment]);
      } else {
        // fallback refresh if API shape changes
        const refresh = await fetch(`/api/posts/${postId}/comments`);
        const refreshJson = await refresh.json();
        setComments(refreshJson.comments ?? []);
      }
      setText("");
      requestAnimationFrame(() => containerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message === "not_authenticated"
            ? "ログインしてください"
            : err.message
          : "コメント送信に失敗しました";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3" id="comments" ref={containerRef}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Comments</p>
        {loading ? <span className="text-xs text-gray-500">loading...</span> : null}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
        <textarea
          ref={inputRef}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="感想や質問をコメント..."
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!text.trim() || submitting}
            onClick={submit}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "送信中..." : "コメントする"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {comments.map((c) => {
          const initials = c.user_id?.slice(0, 2)?.toUpperCase() ?? "US";
          return (
            <div
              key={c.id}
              className="flex gap-3 rounded-2xl border border-white/60 bg-white px-3 py-3 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-slate-900 text-white text-xs font-bold">
                {initials}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-900 break-words">{c.body}</p>
                <p className="text-[11px] text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-gray-500">最初のコメントを書いてみよう</p>
        )}
      </div>
    </div>
  );
}
