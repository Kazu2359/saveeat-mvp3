'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type InsertPayload = {
  user_id: string;
  name: string;
  quantity: number;
  expiry_date: string | null; // 'YYYY-MM-DD' or null
};

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // フォーム状態
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [expiry, setExpiry] = useState<string>(''); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ← 追加：date input を手動で開くための参照
  const dateRef = useRef<HTMLInputElement | null>(null);

  // 未ログインならログインへ（DAY4のガード）
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const next = searchParams?.get('next') ?? '/add';
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    })();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // かんたんバリデーション
    if (!name.trim()) return setErr('食材名は必須です');
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) {
      return setErr('数量は1以上の整数にしてください');
    }
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      return setErr('日付の形式が正しくありません（YYYY-MM-DD）');
    }

    setLoading(true);
    const t = toast.loading('保存中…');
    try {
      // ログインユーザー
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes?.user;
      if (!user) {
        toast.dismiss(t);
        router.replace('/login?next=/add');
        return;
      }

      const payload: InsertPayload = {
        user_id: user.id,
        name: name.trim(),
        quantity: q,
        expiry_date: expiry || null, // 空ならNULL
      };

      const { error } = await supabase.from('pantry_items').insert(payload);
      if (error) throw error;

      toast.success('保存しました！', { id: t });
      router.push('/'); // 成功後トップへ（後で /list に変更可）
    } catch (e: any) {
      const msg = e?.message ?? '保存に失敗しました。もう一度お試しください。';
      setErr(msg);
      toast.error(msg, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      {/* 簡易ナビ（戻る） */}
      <div className="mb-4">
        <Link href="/" className="text-sm underline">← 戻る</Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold">食材を追加</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">食材名 *</label>
          <input
            className="w-full rounded-2xl border px-3 py-2"
            placeholder="banana"
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
          <label className="mb-1 block text-sm font-medium">消費期限（任意）</label>

          {/* ▼ カレンダーを確実に開けるブロック */}
          <div className="relative">
            <input
              ref={dateRef}
              className="w-full rounded-2xl border px-3 py-2 [appearance:auto]"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              // フォーカス時にも自動で開く（対応ブラウザのみ）
              onFocus={(e) => (e.currentTarget as any).showPicker?.()}
            />
            <button
              type="button"
              onClick={() => dateRef.current?.showPicker?.()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-sm underline"
              aria-label="カレンダーを開く"
            >
              開く
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            クリックまたは「開く」でカレンダーが表示されます。未入力でもOK。
          </p>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-black px-4 py-2 text-white transition-opacity disabled:opacity-60"
        >
          {loading ? '保存中…' : '追加する'}
        </button>
      </form>
    </main>
  );
}
