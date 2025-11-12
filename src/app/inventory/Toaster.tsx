"use client";

import { useEffect, useState } from "react";

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setMsg(ce.detail);
      const t = setTimeout(() => setMsg(null), 2500);
      return () => clearTimeout(t);
    };
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none">
      <div className="pointer-events-auto rounded-xl border shadow px-4 py-2 bg-white/90 dark:bg-neutral-900/90">
        {msg}
      </div>
    </div>
  );
}
