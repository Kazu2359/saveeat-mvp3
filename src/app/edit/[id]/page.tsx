"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

type ItemRow = {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  expiry_date: string | null; // 'YYYY-MM-DD' or null
};

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [expiry, setExpiry] = useState<string>(""); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const dateRef = useRef<HTMLInputElement | null>(null);

  // 🔍 行を1件だけ取得（ログインチェックはしない。RLSに任せる）
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pantry_items")
          .select("id,user_id,name,quantity,expiry_date")
          .eq("id", id)
          .maybeSingle<ItemRow>(); // 0件でも例外にしない

        if (error) {
          console.error(error);
          setErr(error.message ?? "データ取得に失敗しました。");
          setFetching(false);
          return;
        }

        if (!data) {
          // RLSで見えない / そもそも存在しない など
          setErr("データが見つかりませんでした。ログイン状態や権限を確認してください。");
          setFetching(false);
          return;
        }

        // ここまで来たら「自分が見えている行」なのでそのままフォームへ
        setName(data.name ?? "");
        setQuantity(String(data.quantity ?? 1));
        setExpiry(data.expiry_date ?? "");

        setFetching(false);
      } catch (e: any) {
        console.error(e);
        setErr("読み込み中にエラーが発生しました。");
        setFetching(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) return setErr("食材名は必須です");
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) {
      return setErr("数量は1以上の整数にしてください");
    }
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      return setErr("日付の形式が正しくありません（YYYY-MM-DD）");
    }

    setLoading(true);
    const t = toast.loading("更新中…");

    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({
          name: name.trim(),
          quantity: q,
          expiry_date: expiry || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("更新しました！", { id: t });
      router.push("/");
    } catch (e: any) {
      const msg =
        e?.message ?? "更新に失敗しました。もう一度お試しください。";
      setErr(msg);
      toast.error(msg, { id: t });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p>読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm underline">
          ← 戻る
        </Link>
        <span className="text-xs text-gray-500">ID: {id}</span>
      </div>

      <h1 className="mb-4 text-2xl font-bold">食材を編集</h1>

      {err && (
        <p className="mb-3 text-sm text-red-600">
          {err}
          {/* ログインページへの導線だけ残しておく */}
          <br />
          <a
            href={`/login?next=/edit/${id}`}
            className="text-blue-500 underline"
          >
            ログイン画面へ移動する
          </a>
        </p>
      )}

      {!err && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">食材名 *</label>
            <input
              className="w-full rounded-2xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">数量 *</label>
            <input
              className="w-full rounded-2xl border px-3 py-2"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              消費期限（任意）
            </label>
            <div className="relative">
              <input
                ref={dateRef}
                className="w-full rounded-2xl border px-3 py-2 [appearance:auto]"
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                onFocus={(e) => (e.currentTarget as any).showPicker?.()}
              />
              <button
                type="button"
                onClick={() => dateRef.current?.showPicker?.()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-sm underline"
              >
                開く
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              未入力でもOK。入力すると期限バッジに反映されます。
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black px-4 py-2 text-white transition-opacity disabled:opacity-60"
          >
            {loading ? "更新中…" : "保存する"}
          </button>
        </form>
      )}
    </main>
  );
}
