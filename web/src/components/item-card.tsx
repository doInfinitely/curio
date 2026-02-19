"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FeedItem } from "@/lib/types";
import { trackImpression } from "@/lib/analytics";
import { useImageColor } from "@/hooks/use-image-color";

export function ItemCard({
  item,
  index,
  stagger = 0,
}: {
  item: FeedItem;
  index: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const tracked = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const color = useImageColor(item.image_url, item.dominant_color);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!tracked.current) {
            tracked.current = true;
            trackImpression(item.id);
          }
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "40px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id]);

  const isFeatured = item.size === "featured";
  const isTall = item.size === "tall";

  const aspectClass = isFeatured
    ? "aspect-[2.2/1]"
    : isTall
      ? "aspect-[3/5]"
      : "aspect-[4/5]";

  const delay = stagger * 80;

  return (
    <Link
      ref={ref}
      href={`/item/${item.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-surface"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? "translateY(0) scale(1)"
          : "translateY(24px) scale(0.97)",
        transition: revealed
          ? `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
          : "none",
      }}
    >
      {color && (
        <div
          className="absolute top-0 left-0 right-0 z-10 h-1 opacity-80"
          style={{ backgroundColor: color }}
        />
      )}

      <div className={`relative w-full ${aspectClass}`}>
        {!imgLoaded && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ backgroundColor: color || "#1e1e1e" }}
          />
        )}

        <Image
          src={item.image_url}
          alt={item.caption || "Item"}
          fill
          sizes={isFeatured ? "100vw" : "(max-width: 640px) 50vw, 33vw"}
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-110 group-active:scale-105 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: color || "#1e1e1e" }}
          onLoad={() => setImgLoaded(true)}
        />

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

        {item.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3">
            <p
              className={`font-bold text-white leading-tight line-clamp-2 drop-shadow-lg ${
                isFeatured ? "text-base" : "text-sm"
              }`}
            >
              {item.caption}
            </p>
          </div>
        )}

        {item.impressions < 50 && (
          <span className="absolute top-3 left-2.5 z-10 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-black shadow-lg">
            New
          </span>
        )}

        {color && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-15"
            style={{
              background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </Link>
  );
}
