/**
 * Takes a hex color from an item's dominant_color and derives
 * a full site palette. Every visit picks a different item,
 * so the whole site shifts tone.
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHSL(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s, l };
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
}

export interface SitePalette {
  accent: string;
  accentDim: string;
  accentBg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
}

export function derivePalette(hex: string): SitePalette {
  const { h, s } = hexToHSL(hex);

  // Clamp saturation so neons don't burn and pastels don't vanish
  const sat = Math.max(0.45, Math.min(s, 0.85));

  return {
    accent: hsl(h, sat, 0.6),
    accentDim: hsl(h, sat * 0.6, 0.4),
    accentBg: hsla(h, sat, 0.5, 0.08),
    // Tint the dark surfaces with a whisper of the hue
    surface: hsl(h, 0.05, 0.08),
    surfaceElevated: hsl(h, 0.06, 0.12),
    border: hsl(h, 0.04, 0.17),
    borderLight: hsl(h, 0.05, 0.2),
  };
}

export function paletteToCSS(p: SitePalette): Record<string, string> {
  return {
    "--accent": p.accent,
    "--accent-dim": p.accentDim,
    "--accent-bg": p.accentBg,
    "--surface": p.surface,
    "--surface-elevated": p.surfaceElevated,
    "--border": p.border,
    "--border-light": p.borderLight,
  };
}
