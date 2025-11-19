"use client";
import { useEffect, useMemo, useState } from "react";

import { Item } from "@/types/item";

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(dateStr);
  const ms = target.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function ExpiryNotifier({ items }: { items: Item[] }) {
  const todayISO = new Date().toISOString().slice(0, 10);

  // 期限が “今日〜3日後” のアイテムを抽出（期限未設定と期限切れは除外）
  const targets = useMemo(() => {
    return items
      .filter((it) => it.expiry_date)
      .map((it) => ({ ...it, d: daysLeft(it.expiry_date) }))
      .filter((it) => it.d !== null && it.d! >= 0 && it.d! <= 3)
      .sort((a, b) => (a.d! - b.d!));
  }, [items]);

  // セッション内で重複表示を防ぐ（1日1回/アイテム）
  const notiKey = (id: string) => `expiry_toast_${id}_${todayISO}`;

  // 表示キュー（3つまで表示、残りはサマリー）
  const queue = useMemo(() => targets.slice(0, 3), [targets]);
  const restCount = Math.max(0, targets.length - queue.length);

  const [visible, setVisible] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const msgs: string[] = [];
    for (const t of queue) {
  msgs.push(t.d === 0 ? `「${t.name}」は本日が期限！` : `「${t.name}」はあと${t.d}日で期限`);
}
if (restCount > 0) {
  msgs.push(`他にも期限間近が ${restCount} 件あります`);
}

    if (msgs.length > 0) {
      setMessages(msgs);
      setVisible(true);
      // 自動で数秒後に閉じる
      const t = setTimeout(() => setVisible(false), 3500 + msgs.length * 500);
      return () => clearTimeout(t);
    }
  }, [queue, restCount, todayISO]);

  if (!visible || messages.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-4 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-3 bg-white/95 backdrop-blur text-sm text-gray-900">
        <ul className="list-disc pl-5 space-y-1">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
