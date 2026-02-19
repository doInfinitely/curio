"use client";

import {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { derivePalette, paletteToCSS, type SitePalette } from "@/lib/palette";
import type { Item } from "@/lib/types";

interface DbItem {
  id: number;
  image_path: string;
  caption: string | null;
  dominant_color: string | null;
  created_at: string;
}

interface PaletteContext {
  heroItem: Item | null;
  palette: SitePalette | null;
}

const Ctx = createContext<PaletteContext>({ heroItem: null, palette: null });

export function usePalette() {
  return useContext(Ctx);
}

function randomAccentHex(): string {
  const h = Math.random() * 360;
  const s = 55 + Math.random() * 30;
  const l = 50 + Math.random() * 15;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function applyPalette(hex: string): SitePalette {
  const p = derivePalette(hex);
  const vars = paletteToCSS(p);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  return p;
}

function clearPalette(p: SitePalette) {
  const vars = paletteToCSS(p);
  const root = document.documentElement;
  for (const key of Object.keys(vars)) {
    root.style.removeProperty(key);
  }
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [heroItem, setHeroItem] = useState<Item | null>(null);
  const [palette, setPalette] = useState<SitePalette | null>(null);
  const paletteRef = useRef<SitePalette | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Apply a random palette immediately so the page is never un-themed
      const fallbackHex = randomAccentHex();
      const fallbackPalette = applyPalette(fallbackHex);
      if (cancelled) return;
      paletteRef.current = fallbackPalette;
      setPalette(fallbackPalette);

      // 2. Fetch items and pick a random product
      let items: DbItem[] = [];
      try {
        const res = await fetch("/api/items");
        items = await res.json();
      } catch {
        // No items available — keep the random palette
        return;
      }

      if (cancelled || items.length === 0) return;

      const chosen = items[Math.floor(Math.random() * items.length)];

      // 3. Use the GPT-extracted dominant color stored in the DB
      const seedHex = chosen.dominant_color ?? fallbackHex;

      // 4. Apply the product-derived palette
      const p = applyPalette(seedHex);
      paletteRef.current = p;
      setPalette(p);

      // 5. Expose the chosen item as the hero
      setHeroItem({
        id: String(chosen.id),
        store_id: "x-smoke-shop",
        image_url: chosen.image_path,
        thumb_url: chosen.image_path,
        blurhash: null,
        caption: chosen.caption,
        created_at: chosen.created_at,
        status: "ready",
        aspect_ratio: 1,
        dominant_color: seedHex,
        quality_score: 1,
        impressions: 0,
        opens: 0,
        avg_dwell: 0,
        ctr: 0,
      });
    }

    init();

    return () => {
      cancelled = true;
      if (paletteRef.current) clearPalette(paletteRef.current);
    };
  }, []);

  return <Ctx.Provider value={{ heroItem, palette }}>{children}</Ctx.Provider>;
}
