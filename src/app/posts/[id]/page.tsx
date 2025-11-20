// src/app/posts/[id]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,title,body,ingredients,media,created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-500">Post not found.</p>
        <Link href="/feed" className="text-sm text-blue-600 underline">
          Back to feed
        </Link>
      </main>
    );
  }

  const post: Post = {
    ...data,
    ingredients: Array.isArray((data as { ingredients?: string[] }).ingredients)
      ? ((data as { ingredients?: string[] }).ingredients ?? [])
      : [],
    profiles: undefined,
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-900 px-6 py-8 text-white shadow-lg">
        <Link href="/feed" className="inline-flex items-center text-sm text-emerald-50 underline-offset-4 hover:underline">
          ← Back to feed
        </Link>
        <h1 className="mt-3 text-3xl font-bold leading-tight">{post.title}</h1>
        <p className="text-sm text-emerald-100">by {post.user_id?.slice(0, 8) ?? "User"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {post.media?.map((m, idx) => (
          <div key={idx} className="relative h-72 overflow-hidden rounded-2xl border border-white/60 bg-black shadow-sm">
            {m.type === "video" ? (
              <video className="h-full w-full" controls src={m.url} />
            ) : (
              <Image src={m.url} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        {post.body && <p className="text-base text-gray-800 whitespace-pre-wrap">{post.body}</p>}
        {post.ingredients?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.ingredients.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
