// src/app/myposts/page.tsx
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";
import DeletePostButton from "@/components/DeletePostButton";

export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
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

  const { data } = await supabase
    .from("posts")
    .select("id,user_id,title,media,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (data as Post[] | null) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 px-6 py-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">My Posts</h1>
        <p className="text-sm text-emerald-100">Review and edit your own dishes.</p>
        <div className="mt-3 flex gap-3">
          <Link
            href="/upload"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:scale-105 transition"
          >
            Create new post
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const cover = post.media?.[0]?.url;
          return (
            <div
              key={post.id}
              className="group relative flex h-64 flex-col overflow-hidden rounded-2xl border border-emerald-50 bg-white/80 shadow-sm ring-1 ring-black/5"
            >
              <div className="relative flex-1 overflow-hidden bg-gray-50">
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
                <p className="text-xs uppercase tracking-wider text-emerald-700">Your post</p>
                <p className="text-base font-semibold text-gray-900 line-clamp-2">{post.title}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Link
                    href={`/posts/${post.id}`}
                    className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100"
                  >
                    View
                  </Link>
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                  >
                    Edit
                  </Link>
                  <DeletePostButton postId={post.id} postTitle={post.title} />
                </div>
              </div>
            </div>
          );
        })}

        {posts.length === 0 && (
          <p className="text-sm text-gray-600">No posts yet. Try adding one with “Create new post”.</p>
        )}
      </div>
    </main>
  );
}
