"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { derivePalette, paletteToCSS, type SitePalette } from "@/lib/palette";
import type { Item } from "@/lib/types";

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
  const [heroItem] = useState<Item | null>(null);
  const [palette, setPalette] = useState<SitePalette | null>(null);

  useEffect(() => {
    const hex = randomAccentHex();
    const p = applyPalette(hex);
    setPalette(p);

    return () => {
      clearPalette(p);
    };
  }, []);

  return <Ctx.Provider value={{ heroItem, palette }}>{children}</Ctx.Provider>;
}
