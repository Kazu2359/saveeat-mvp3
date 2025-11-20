// src/app/posts/[id]/edit/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import EditPostForm from "@/components/EditPostForm";
import type { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <p className="text-red-500">Invalid post id.</p>
        <Link className="text-blue-600 underline" href="/myposts">
          Back to My Posts
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <p className="text-red-500">Please log in.</p>
        <Link className="text-blue-600 underline" href="/login">
          Go to login
        </Link>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,title,body,ingredients,media,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <p className="text-red-500">Post not found or no permission.</p>
        <Link className="text-blue-600 underline" href="/myposts">
          Back to My Posts
        </Link>
      </main>
    );
  }

  const post = data as Post;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-900 px-6 py-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-sm text-emerald-100">ID: {post.id}</p>
      </div>
      <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
        <EditPostForm post={post} />
      </div>
    </main>
  );
}
