"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { generateMockItems } from "@/lib/mock-data";
import { rankAndLayout } from "@/lib/ranking";
import { FeedItem } from "@/lib/types";
import { trackOpen, trackDwell } from "@/lib/analytics";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const openedAt = useRef(Date.now());
  const [allItems] = useState(() => rankAndLayout(generateMockItems(30)));

  const item = allItems.find((i) => i.id === id);
  const similar = allItems.filter((i) => i.id !== id).slice(0, 8);

  useEffect(() => {
    if (id) trackOpen(id);
    return () => {
      if (id) trackDwell(id, Date.now() - openedAt.current);
    };
  }, [id]);

  if (!item) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg text-text-secondary">Item not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-surface-elevated px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-border"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-0 pb-24 sm:px-4">
      {/* Hero image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface sm:mt-4 sm:rounded-2xl">
        <Image
          src={item.image_url}
          alt={item.caption || "Item detail"}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 672px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {item.caption && (
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {item.caption}
            </h1>
          )}
          <p className="mt-1.5 text-sm text-white/60">{timeAgo(item.created_at)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 px-5 pt-5">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {item.impressions} views
        </div>
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {Math.round(item.avg_dwell)}s avg
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-5 pt-5">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated py-3 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated py-3 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>

      {/* Similar items */}
      {similar.length > 0 && (
        <section className="mt-10 px-5">
          <h2 className="text-lg font-bold text-text-primary">You might like</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-4 scrollbar-none">
            {similar.map((si) => (
              <Link
                key={si.id}
                href={`/item/${si.id}`}
                className="flex-none"
              >
                <div className="relative h-44 w-32 overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={si.thumb_url || si.image_url}
                    alt={si.caption || "Similar item"}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                {si.caption && (
                  <p className="mt-1.5 w-32 truncate text-xs text-text-secondary">
                    {si.caption}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
