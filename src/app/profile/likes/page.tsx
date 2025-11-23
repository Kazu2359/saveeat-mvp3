import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function ProfileLikesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl p-6 space-y-4">
        <p className="text-red-500">Please log in.</p>
        <Link className="text-blue-600 underline" href="/login">
          Go to login
        </Link>
      </main>
    );
  }

  const { data: likedRows } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
  const likedIds = Array.isArray(likedRows)
    ? Array.from(new Set(likedRows.map((r) => (r as { post_id?: string }).post_id).filter(Boolean)))
    : [];

  let likedPosts: Post[] = [];
  if (likedIds.length > 0) {
    const { data: likedPostsData } = await supabase
      .from("posts")
      .select("id,title,media,created_at,user_id")
      .in("id", likedIds)
      .order("created_at", { ascending: false });
    likedPosts = (likedPostsData as Post[] | null) ?? [];
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Profile</p>
            <h1 className="text-2xl font-bold text-gray-900">Liked Posts</h1>
          </div>
          <Link href="/profile" className="text-sm text-emerald-700 underline">
            ← Back to profile
          </Link>
        </div>

        {likedPosts.length === 0 && <p className="text-sm text-gray-600">まだLikeした投稿がありません。</p>}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {likedPosts.map((post) => {
            const cover = post.media?.[0]?.url;
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group relative flex h-64 flex-col overflow-hidden rounded-2xl border border-emerald-50 bg-white/80 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex-1 overflow-hidden bg-gray-50">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 px-4 py-3">
                  <p className="text-base font-semibold text-gray-900 line-clamp-1">{post.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.user_id?.slice(0, 8) ?? "User"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
