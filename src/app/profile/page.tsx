import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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

  const profileRes = await supabase.from("profiles").select("id,name,avatar_url,bio").eq("id", user.id).single();
  const profile = profileRes.data ?? { name: user.email ?? "User", avatar_url: null, bio: "" };

  const { data: postsData } = await supabase
    .from("posts")
    .select("id,title,media,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (postsData as Post[] | null) ?? [];
  const postIds = posts.map((p) => p.id);

  // Likeした投稿を取得
  const { data: likedRows } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
  const likedIds = Array.isArray(likedRows)
    ? Array.from(new Set(likedRows.map((r) => (r as { post_id?: string }).post_id).filter(Boolean))) // dedupe + filter
    : [];
  const likedPosts: Post[] = [];
  if (likedIds.length > 0) {
    const { data: likedPostsData } = await supabase
      .from("posts")
      .select("id,title,media,created_at,user_id")
      .in("id", likedIds)
      .order("created_at", { ascending: false });
    if (Array.isArray(likedPostsData)) likedPosts.push(...(likedPostsData as Post[]));
  }

  let totalLikes = 0;
  let likersByPost: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: likesData } = await supabase.from("post_likes").select("post_id").in("post_id", postIds);
    if (Array.isArray(likesData)) {
      totalLikes = likesData.length;
      likersByPost = likesData.reduce<Record<string, number>>((acc, row) => {
        const pid = (row as { post_id?: string }).post_id;
        if (pid) acc[pid] = (acc[pid] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const stats = [
    { label: "Posts", value: posts.length, href: "/profile/posts" },
    { label: "Followers", value: "0", href: "/profile/followers" }, // placeholder until table exists
    { label: "Following", value: "0", href: "/profile/following" }, // placeholder until table exists
    { label: "Likes", value: totalLikes, href: "/profile/likes" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="rounded-3xl bg-white/90 p-6 shadow-lg ring-1 ring-black/5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-200 to-white shadow-inner">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.name ?? "avatar"} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-emerald-700">
                    {(profile.name ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-900">{profile.name ?? user.email ?? "User"}</p>
                <p className="text-sm text-gray-600">{profile.bio ?? ""}</p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>ID: {user.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/upload"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              >
                New Post
              </Link>
              <Link
                href="/myposts"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow hover:bg-gray-50"
              >
                Manage Posts
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 px-4 py-4 text-center sm:grid-cols-4">
            {stats.map((s) => {
              const content = (
                <>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
                </>
              );
              return s.href ? (
                <a key={s.label} href={s.href} className="space-y-1 transition hover:text-emerald-600">
                  {content}
                </a>
              ) : (
                <div key={s.label} className="space-y-1">
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links to dedicated pages */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">ショートカット</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/profile/posts" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-100">
              自分の投稿一覧へ
            </Link>
            <Link href="/profile/likes" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-100">
              Likeした投稿へ
            </Link>
            <Link href="/profile/followers" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-100">
              フォロワーを見る
            </Link>
            <Link href="/profile/following" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-100">
              フォロー中を見る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
