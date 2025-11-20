// src/app/upload/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { MediaItem } from "@/types/post";

const MAX_IMAGES = 10;
const MAX_VIDEO = 1;
const BUCKET = "post-media";

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected.slice(0, MAX_IMAGES + MAX_VIDEO));
  };

  const uploadMedia = async (): Promise<MediaItem[]> => {
    const uploaded: MediaItem[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${data.path}`;
      const type: MediaItem["type"] = file.type.startsWith("video") ? "video" : "image";
      uploaded.push({ type, url });
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const imageCount = files.filter((f) => f.type.startsWith("image")).length;
    const videoCount = files.filter((f) => f.type.startsWith("video")).length;
    if (imageCount > MAX_IMAGES || videoCount > MAX_VIDEO) {
      setError(`写真は最大${MAX_IMAGES}枚、動画は${MAX_VIDEO}本までです`);
      return;
    }
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (files.length === 0) {
      setError("写真または動画を選択してください");
      return;
    }

    setLoading(true);
    try {
      const media = await uploadMedia();
      const ingredients = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: body, ingredients, media }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "投稿に失敗しました");

      router.push(`/posts/${json.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "投稿に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-700 to-emerald-500 text-white shadow-lg">
        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">share your dish</p>
          <h1 className="text-3xl font-bold mt-2">料理を投稿して自慢しよう</h1>
          <p className="mt-1 text-sm text-emerald-50">
            材料タグで見つけやすく。写真は最大{MAX_IMAGES}枚、動画は{MAX_VIDEO}本（720p/60秒目安）。
          </p>
        </div>
      </div>

      <form
        className="space-y-5 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">タイトル</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-inner focus:border-emerald-500 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例：鶏むね肉の照り焼き"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">材料タグ（カンマ区切り）</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-inner focus:border-emerald-500 focus:outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: 鶏むね肉, にんじん, じゃがいも"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">説明</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-3 shadow-inner focus:border-emerald-500 focus:outline-none"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コツやポイント、下味や工程などをメモ"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">写真・動画</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onFileChange}
            className="w-full rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-sm"
          />
          <p className="text-xs text-gray-500">写真は最大{MAX_IMAGES}枚、動画は{MAX_VIDEO}本まで。720p/60秒程度を推奨。</p>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <span
                key={f.name}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
              >
                {f.type.startsWith("video") ? "🎥" : "🖼"} {f.name}
              </span>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-white font-semibold shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </main>
  );
}
