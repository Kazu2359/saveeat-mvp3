"use client";

import { useEffect, useState } from "react";

export default function ToasterClient({ message }: { message?: string }) {
  const [text, setText] = useState<string | null>(message ?? null);
  const [show, setShow] = useState(!!message);

  // ---------------------------
  // ① グローバル関数を登録
  // ---------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showToast = (msg: string) => {
        setText(msg);
        setShow(true);

        setTimeout(() => {
          setShow(false);
        }, 2500);
      };
    }
  }, []);

  // ---------------------------
  // ② クッキー（サーバー側トースト）対応
  // ---------------------------
  useEffect(() => {
    if (!message) return;

    const t = setTimeout(() => setShow(false), 2500);
    document.cookie = "toast=; Max-Age=0; path=/";
    return () => clearTimeout(t);
  }, [message]);

  if (!text || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-50">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-2 bg-green-600 text-white backdrop-blur">
        {text}
      </div>
    </div>
  );
  
}

// TypeScript に window.showToast を追加
declare global {
  interface Window {
    showToast: (msg: string) => void;
  }
}
