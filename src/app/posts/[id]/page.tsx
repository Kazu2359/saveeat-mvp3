import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import PostMediaShowcase from "@/components/PostMediaShowcase";
import PostInteractionPanel from "@/components/PostInteractionPanel";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString();
}

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,title,body,ingredients,media,created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-500">Post not found.</p>
        <Link href="/feed" className="text-sm text-blue-600 underline">
          Back to feed
        </Link>
      </main>
    );
  }

  const [likeRes, commentsRes, likedRes] = await Promise.all([
    supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", id),
    supabase
      .from("post_comments")
      .select("id,body,created_at,user_id", { count: "exact" })
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("post_likes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", id)
          .eq("user_id", user.id)
      : Promise.resolve({ count: 0 } as { count?: number }),
  ]);

  const comments = Array.isArray(commentsRes.data) ? commentsRes.data : [];
  const commentCount = commentsRes.count ?? comments.length ?? 0;
  const isLiked = (likedRes as { count?: number }).count ? (likedRes as { count?: number }).count! > 0 : false;
  const post: Post = {
    ...data,
    ingredients: Array.isArray((data as { ingredients?: string[] }).ingredients)
      ? ((data as { ingredients?: string[] }).ingredients ?? [])
      : [],
    like_count: likeRes.count ?? 0,
    comment_count: commentCount,
    is_liked: isLiked,
    profiles: undefined,
  };

  const timeAgo = formatRelativeTime(post.created_at);
  const shortUser = post.user_id?.slice(0, 8) ?? "User";

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-slate-900 text-white shadow-inner shadow-emerald-200">
              <span className="text-sm font-semibold">{shortUser.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">{shortUser}</span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100">
              Follow
            </button>
            <button className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
              Share
            </button>
            <Link
              href="/feed"
              className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <PostMediaShowcase media={post.media} alt={post.title} />

          <PostInteractionPanel
            postId={post.id}
            postTitle={post.title}
            body={post.body}
            tags={post.ingredients}
            timeAgo={timeAgo}
            shortUser={shortUser}
            initialLikeCount={post.like_count ?? 0}
            initialCommentCount={commentCount}
            initialIsLiked={post.is_liked}
            initialComments={comments as {
              id: string;
              body: string;
              created_at: string;
              user_id: string;
              profiles?: { name?: string | null; avatar_url?: string | null } | null;
            }[]}
          />
        </div>
      </div>
    </main>
  );
}
