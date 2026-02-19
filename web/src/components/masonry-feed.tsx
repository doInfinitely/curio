"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FeedItem } from "@/lib/types";
import { generateMockItems } from "@/lib/mock-data";
import { rankAndLayout } from "@/lib/ranking";
import { ItemCard } from "./item-card";

const PAGE_SIZE = 24;
const COL_COUNT = 2;

function estimateHeight(item: FeedItem): number {
  if (item.size === "tall") return 5 / 3;
  return 5 / 4;
}

type Segment =
  | { type: "masonry"; columns: FeedItem[][]; startIndex: number }
  | { type: "featured"; item: FeedItem; startIndex: number };

function buildLayout(items: FeedItem[]): Segment[] {
  const segments: Segment[] = [];
  let batch: FeedItem[] = [];
  let globalIndex = 0;
  let batchStartIndex = 0;

  const flushBatch = () => {
    if (batch.length === 0) return;
    const columns: FeedItem[][] = Array.from({ length: COL_COUNT }, () => []);
    const heights = new Array(COL_COUNT).fill(0);

    for (const item of batch) {
      const shortest = heights.indexOf(Math.min(...heights));
      columns[shortest].push(item);
      heights[shortest] += estimateHeight(item);
    }

    segments.push({ type: "masonry", columns, startIndex: batchStartIndex });
    batch = [];
  };

  for (const item of items) {
    if (item.size === "featured") {
      flushBatch();
      segments.push({ type: "featured", item, startIndex: globalIndex });
      globalIndex++;
      batchStartIndex = globalIndex;
    } else {
      batch.push(item);
      globalIndex++;
    }
  }
  flushBatch();

  return segments;
}

export function MasonryFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);

  const loadMore = useCallback(() => {
    const page = pageRef.current++;
    const raw = generateMockItems(PAGE_SIZE, page);
    const ranked = rankAndLayout(raw);
    setItems((prev) => [...prev, ...ranked]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const segments = useMemo(() => buildLayout(items), [items]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  let cardIndex = 0;

  return (
    <div className="w-full space-y-2">
      {segments.map((seg, segIdx) => {
        if (seg.type === "featured") {
          cardIndex++;
          return (
            <ItemCard
              key={`feat-${seg.item.id}`}
              item={seg.item}
              index={cardIndex}
              stagger={0}
            />
          );
        }

        let colItemCounter = 0;

        return (
          <div key={`mas-${segIdx}`} className="flex items-start gap-2">
            {seg.columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-1 flex-col gap-2">
                {col.map((item) => {
                  cardIndex++;
                  const stagger = colItemCounter++;
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      index={cardIndex}
                      stagger={stagger}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      <div ref={sentinelRef} className="flex h-20 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    </div>
  );
}
