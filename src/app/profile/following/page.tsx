import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
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

  const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id);
  const following = Array.isArray(data) ? data : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Profile</p>
            <h1 className="text-2xl font-bold text-gray-900">Following</h1>
          </div>
          <Link href="/profile" className="text-sm text-emerald-700 underline">
            ← Back to profile
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">フォロー一覧の取得に失敗しました。</p>}
        {following.length === 0 && !error && <p className="text-sm text-gray-600">まだフォロー中のユーザーがいません。</p>}

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {following.map((row) => {
            const fid = (row as { followee_id?: string }).followee_id ?? "";
            const name = fid.slice(0, 8) || "User";
            return (
              <div
                key={fid}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-200 to-white text-sm font-semibold text-emerald-700">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-[11px] text-gray-500">ID: {fid.slice(0, 12)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
