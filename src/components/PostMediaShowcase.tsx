"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { MediaItem } from "@/types/post";

export default function PostMediaShowcase({
  media,
  alt,
}: {
  media: MediaItem[] | null | undefined;
  alt: string;
}) {
  const safeMedia = media?.length ? media : null;
  const [active, setActive] = useState(0);

  const current = useMemo(() => {
    if (!safeMedia) return null;
    const idx = Math.min(active, safeMedia.length - 1);
    return safeMedia[idx];
  }, [active, safeMedia]);

  if (!safeMedia) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white/70 text-sm text-gray-500">
        No media uploaded yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[520px] overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-lg ring-1 ring-black/5">
        {current?.type === "video" ? (
          <video className="h-full w-full object-cover" src={current.url} controls autoPlay muted />
        ) : (
          <Image
            src={current?.url ?? safeMedia[0].url}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            priority
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      </div>

      {safeMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeMedia.map((item, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                onClick={() => setActive(idx)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border ${
                  isActive ? "border-emerald-500 ring-2 ring-emerald-200" : "border-white/60"
                } bg-white/70 shadow-sm transition hover:-translate-y-0.5`}
                aria-label={`Show media ${idx + 1}`}
              >
                {item.type === "video" ? (
                  <video className="h-full w-full object-cover" src={item.url} muted />
                ) : (
                  <Image
                    src={item.url}
                    alt={`${alt} ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 rounded-xl ring-1 ring-black/5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
