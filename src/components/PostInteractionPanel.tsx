"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import PostCommentsSection from "./PostCommentsSection";

type Props = {
  postId: string;
  postTitle: string;
  body?: string | null;
  tags?: string[];
  timeAgo: string;
  shortUser: string;
  initialLikeCount: number;
  initialCommentCount: number;
  initialIsLiked?: boolean;
  initialComments?: {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
  }[];
};

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const temp = document.createElement("textarea");
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
  return Promise.resolve();
}

export default function PostInteractionPanel({
  postId,
  postTitle,
  body,
  tags,
  timeAgo,
  shortUser,
  initialLikeCount,
  initialCommentCount,
  initialIsLiked,
  initialComments,
}: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialComments?.length ?? initialCommentCount ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(!!initialIsLiked);
  const [isFollowing, setIsFollowing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likeLoading, startLikeTransition] = useTransition();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const tagsToRender = useMemo(() => (tags ?? []).filter(Boolean), [tags]);

  const refreshStats = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setLikeCount(json.like_count ?? likeCount);
        setCommentCount(json.comment_count ?? commentCount);
        setIsLiked(!!json.is_liked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = () => {
    startLikeTransition(async () => {
      try {
        const method = isLiked ? "DELETE" : "POST";
        const res = await fetch(`/api/posts/${postId}/like`, { method, credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = json.error === "not_authenticated" ? "ログインしてください" : json.error ?? "いいねに失敗しました";
          setLikeError(errMsg);
          return;
        }
        if (typeof json.like_count === "number") setLikeCount(json.like_count);
        if (typeof json.is_liked === "boolean") setIsLiked(json.is_liked);
        setLikeError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "いいねに失敗しました";
        setLikeError(msg);
      } finally {
        refreshStats();
      }
    });
  };

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
    setShareMsg(isFollowing ? "フォローを解除しました" : "フォローしました");
    setTimeout(() => setShareMsg(null), 2000);
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/posts/${postId}`;
      if (navigator.share) {
        await navigator.share({ url, title: postTitle });
        setShareMsg("シェアしました");
      } else {
        await copyToClipboard(url);
        setShareMsg("リンクをコピーしました");
      }
    } catch {
      setShareMsg("シェアに失敗しました");
    } finally {
      setTimeout(() => setShareMsg(null), 2000);
    }
  };

  const focusComment = () => {
    const el = commentInputRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
  };

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Recipe</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{postTitle}</h1>
          <p className="text-sm text-gray-500">
            Posted {timeAgo} · by {shortUser}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            className={`rounded-full border px-3 py-1 font-semibold shadow-sm transition ${
              isFollowing
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={handleFollow}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
        <button
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-sm ring-1 ring-black/5 transition ${
            isLiked ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white hover:bg-emerald-50"
          }`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
          <span>{isLiked ? "Liked" : "Like"}</span>
        </button>
        <span className="text-gray-700">{likeCount} likes</span>
        <span className="text-gray-300">•</span>
        <button
          onClick={focusComment}
          className="text-gray-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-700"
        >
          {commentCount} comments
        </button>
        <span className="text-gray-300">•</span>
        <button
          onClick={focusComment}
          className="text-gray-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-700"
        >
          💬 Comment
        </button>
        {shareMsg && <span className="text-xs text-emerald-700">{shareMsg}</span>}
        {likeError && <span className="text-xs text-red-600">{likeError}</span>}
      </div>

      {body && (
        <div className="rounded-2xl border border-white/60 bg-white px-4 py-3 text-base text-gray-800 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
      )}

      {tagsToRender.length ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Ingredients / Tags</p>
          <div className="flex flex-wrap gap-2">
            {tagsToRender.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <PostCommentsSection
        postId={postId}
        onCountSync={(count) => setCommentCount(count)}
        inputRef={commentInputRef}
        initialComments={initialComments}
      />

      <div className="mt-auto flex flex-wrap gap-3 text-sm">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          ← Back to feed
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-md hover:from-emerald-600 hover:to-emerald-700"
        >
          ＋ Post your dish
        </Link>
      </div>
    </div>
  );
}
