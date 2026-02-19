"use client";

import { useEffect, useRef, useState } from "react";
import { extractDominantColor } from "@/lib/color-extract";

/**
 * Extracts the dominant color from an image URL.
 * Returns `fallback` immediately, then resolves the real extracted color.
 * Skips extraction entirely if a usable fallback is provided.
 */
export function useImageColor(
  imageUrl: string | undefined,
  fallback: string | null | undefined
): string | null {
  const [color, setColor] = useState<string | null>(fallback ?? null);
  const urlRef = useRef(imageUrl);

  useEffect(() => {
    if (fallback) {
      setColor(fallback);
      return;
    }
    if (!imageUrl) return;

    urlRef.current = imageUrl;
    let cancelled = false;

    extractDominantColor(imageUrl).then((c) => {
      if (!cancelled && urlRef.current === imageUrl && c) {
        setColor(c);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, fallback]);

  return color;
}
