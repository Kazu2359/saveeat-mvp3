"use client";
import { useEffect, useState } from "react";

export default function ToasterClient({ message }: { message?: string }) {
  const [show, setShow] = useState(!!message);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setShow(false), 2500);
    // 表示後にクッキーを即消す（次回に残らないように）
    document.cookie = "toast=; Max-Age=0; path=/";
    return () => clearTimeout(t);
  }, [message]);

  if (!message || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-50">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-2 bg-white/90 backdrop-blur">
        {message}
      </div>
    </div>
  );
}
