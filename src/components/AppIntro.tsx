// src/components/AppIntro.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AppIntro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1200); // brief splash on first paint
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-emerald-600 via-black to-gray-900 text-white transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3 text-2xl font-semibold tracking-wide">
        <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-inner overflow-hidden">
          <Image
            src="/icons/icon-192.png"
            alt="SaveEat"
            width={48}
            height={48}
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-[0.3em] text-emerald-200">SaveEat</span>
          <span>Fresh start</span>
        </div>
      </div>
    </div>
  );
}
