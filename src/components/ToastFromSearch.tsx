"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ToastFromSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = searchParams.get("toast"); // URL の ?toast=... を取得
  const show = toast === "deleted";

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      router.replace("/", { scroll: false });
    }, 2000);
    return () => clearTimeout(t);
  }, [router, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-50">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-2 bg-white/90 backdrop-blur">
        削除しました。
      </div>
    </div>
  );
}
