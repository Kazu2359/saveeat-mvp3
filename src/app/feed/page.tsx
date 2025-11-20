// src/app/feed/page.tsx
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id,user_id,title,media,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const posts = (data as Post[] | null) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-slate-900 text-white shadow-lg">
        <div className="flex flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">community feed</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">みんなの料理アイデア</h1>
            <p className="mt-2 text-sm text-emerald-50">
              一人暮らしや主婦のリアルな料理をシェア。気に入ったら「投稿する」から自慢の一品を追加しよう。
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition transform hover:scale-105"
            href="/upload"
          >
            投稿する
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
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
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-emerald-700">
                  {post.user_id?.slice(0, 8) ?? "User"}
                </p>
                <p className="text-base font-semibold text-gray-900 line-clamp-2">{post.title}</p>
                <p className="text-xs text-gray-500">#食材タグで絞り込み予定</p>
              </div>
            </Link>
          );
        })}

        {posts.length === 0 && (
          <p className="text-sm text-gray-600">まだ投稿がありません。最初の一品をシェアしよう！</p>
        )}
      </div>
    </main>
  );
}
