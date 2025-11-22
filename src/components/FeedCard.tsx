"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import PostCommentsSection from "./PostCommentsSection";

type MediaItem = {
  type: "image" | "video";
  url: string;
};

type BasePost = {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  ingredients?: string[];
  media?: MediaItem[];
  created_at: string;
};

type Detail = {
  like_count?: number;
  comment_count?: number;
  is_liked?: boolean;
  body?: string;
  ingredients?: string[];
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

export default function FeedCard({ post }: { post: BasePost }) {
  const [detail, setDetail] = useState<Detail>({
    like_count: undefined,
    comment_count: undefined,
    is_liked: undefined,
    body: post.body,
    ingredients: post.ingredients,
  });
  const [expanded, setExpanded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [likeLoading, startLikeTransition] = useTransition();
  const commentRef = useRef<HTMLTextAreaElement | null>(null);

  const cover = useMemo(() => post.media?.[0]?.url ?? null, [post.media]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/posts/${post.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "failed");
        setDetail({
          like_count: json.like_count ?? 0,
          comment_count: json.comment_count ?? 0,
          is_liked: json.is_liked ?? false,
          body: json.body ?? post.body,
          ingredients: Array.isArray(json.ingredients) ? json.ingredients : post.ingredients ?? [],
        });
        setIsLiked(!!json.is_liked);
        setLikeCount(json.like_count ?? 0);
        setCommentCount(json.comment_count ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [post.id, post.body, post.ingredients]);

  const handleLike = () => {
    startLikeTransition(async () => {
      try {
        const method = isLiked ? "DELETE" : "POST";
        const res = await fetch(`/api/posts/${post.id}/like`, { method, credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = json.error === "not_authenticated" ? "ログインしてください" : json.error ?? "いいねに失敗しました";
          setLikeError(errMsg);
          return;
        }
        setIsLiked(!isLiked);
        setLikeCount((c) => c + (isLiked ? -1 : 1));
        setLikeError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "いいねに失敗しました";
        setLikeError(msg);
      }
    });
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/posts/${post.id}`;
      if (navigator.share) {
        await navigator.share({ url, title: post.title });
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
    setExpanded(true);
    requestAnimationFrame(() => {
      commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      commentRef.current?.focus();
    });
  };

  const timeAgo = useMemo(() => {
    const date = new Date(post.created_at);
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    if (diff < day * 7) return `${Math.floor(diff / day)}d`;
    return date.toLocaleDateString();
  }, [post.created_at]);

  return (
    <article className="overflow-hidden rounded-3xl border border-emerald-50 bg-white/90 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-slate-900 text-white text-xs font-semibold">
            {(post.user_id?.slice(0, 2) ?? "US").toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{post.user_id?.slice(0, 8) ?? "User"}</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href={`/posts/${post.id}`}
            className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            詳細
          </Link>
          <button
            className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </div>

      {cover ? (
        <div className="relative h-[420px] w-full overflow-hidden bg-gray-100">
          <Image
            src={cover}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover"
            priority={false}
          />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
          No image
        </div>
      )}

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-800">
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
          <span className="text-gray-800">{likeCount} likes</span>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-gray-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-700"
          >
            {commentCount} comments
          </button>
          <span className="text-gray-300">•</span>
          <button onClick={focusComment} className="text-gray-800 hover:text-emerald-700">
            💬 コメント
          </button>
          {shareMsg && <span className="text-xs text-emerald-700">{shareMsg}</span>}
          {likeError && <span className="text-xs text-red-600">{likeError}</span>}
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
          {loadingDetail ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : (
            detail.body && <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{detail.body}</p>
          )}
        </div>

        {detail.ingredients && detail.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detail.ingredients.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {expanded && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
            <PostCommentsSection
              postId={post.id}
              inputRef={commentRef}
              onCountSync={(count) => setCommentCount(count)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
