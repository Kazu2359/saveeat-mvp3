// src/app/feed/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";
import FeedCard from "@/components/FeedCard";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id,user_id,title,body,media,created_at,ingredients")
    .order("created_at", { ascending: false })
    .limit(12);

  const posts = (data as Post[] | null) ?? [];

  return (
    <main className="bg-gradient-to-b from-emerald-50 via-white to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-slate-900 text-white shadow-lg">
          <div className="flex flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">community feed</p>
              <h1 className="mt-1 text-3xl font-bold leading-tight">みんなの投稿</h1>
              <p className="mt-2 text-sm text-emerald-50">
                縦スクロールで料理写真を眺めて、気に入ったらその場でいいね・コメント・シェア。インスピレーションが湧いたら「投稿する」であなたの一皿を追加。
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

        <div className="space-y-5">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-gray-600">まだ投稿がありません。最初の一品をシェアしよう！</p>
          )}
        </div>
      </div>
    </main>
  );
}
