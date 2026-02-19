"use client";

import Image from "next/image";
import Link from "next/link";
import { usePalette } from "./palette-provider";

export function ColorStoryBanner() {
  const { heroItem } = usePalette();

  if (!heroItem) return null;

  return (
    <Link
      href={`/item/${heroItem.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-accent-bg p-3 transition-colors hover:border-accent/30"
    >
      <div className="relative h-10 w-10 flex-none overflow-hidden rounded-lg">
        <Image
          src={heroItem.thumb_url || heroItem.image_url}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-accent">Today&apos;s color story</p>
        <p className="truncate text-xs text-text-secondary">
          {heroItem.caption || "This item is setting the vibe"}
        </p>
      </div>
      <div
        className="h-5 w-5 flex-none rounded-full border border-white/10"
        style={{ backgroundColor: heroItem.dominant_color || undefined }}
      />
    </Link>
  );
}
