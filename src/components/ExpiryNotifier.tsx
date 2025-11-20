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

  // 期限あり、かつ今日〜3日後のアイテムのみ抽出
  const targets = useMemo(() => {
    return items
      .filter((it) => it.expiry_date)
      .map((it) => ({ ...it, d: daysLeft(it.expiry_date) }))
      .filter((it) => it.d !== null && it.d! >= 0 && it.d! <= 3)
      .sort((a, b) => a.d! - b.d!);
  }, [items]);

  // 表示キューを最大3件までに制限
  const queue = useMemo(() => targets.slice(0, 3), [targets]);
  const restCount = Math.max(0, targets.length - queue.length);

  const messages = useMemo(() => {
    const list: string[] = [];
    for (const t of queue) {
      list.push(t.d === 0 ? `「${t.name}」は本日が期限！` : `「${t.name}」はあと${t.d}日で期限`);
    }
    if (restCount > 0) {
      list.push(`他にも期限間近が ${restCount} 件あります`);
    }
    return list;
  }, [queue, restCount]);

  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500 + messages.length * 500);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [messages, todayISO]);

  if (!visible || messages.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-4 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-3 bg-white/95 backdrop-blur text-sm text-gray-900">
        <ul className="list-disc pl-5 space-y-1">
          {messages.map((m, i) => (
            <li key={`${todayISO}_${i}`}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
