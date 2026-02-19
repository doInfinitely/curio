/**
 * Client-side dominant color extraction using Canvas + median-cut quantization.
 * Loads an image onto a small canvas, reads pixel data, and returns the most
 * visually prominent colors — biased toward vibrant hues suitable for theming.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rgbToHex({ r, g, b }: RGB): string {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function brightness({ r, g, b }: RGB): number {
  return (r * 299 + g * 587 + b * 114) / 1000 / 255;
}

/**
 * Vibrancy score — prefers saturated, mid-brightness colors that
 * make good accent / theme seeds.
 */
function vibrancy(c: RGB): number {
  const s = saturation(c);
  const br = brightness(c);
  const midBoost = 1 - Math.abs(br - 0.5) * 2; // peaks at 50% brightness
  return s * 0.7 + midBoost * 0.3;
}

// ---------------------------------------------------------------------------
// Image → pixels
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const SAMPLE = 64;

function getPixels(img: HTMLImageElement): RGB[] {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      a = data[i + 3];

    if (a < 128) continue;

    // Discard near-white / near-black — they make poor theme seeds
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    if (luma > 240 || luma < 15) continue;

    pixels.push({ r, g, b });
  }
  return pixels;
}

// ---------------------------------------------------------------------------
// Median-cut quantization
// ---------------------------------------------------------------------------

function channelRange(pixels: RGB[], ch: "r" | "g" | "b"): number {
  let min = 255,
    max = 0;
  for (const p of pixels) {
    if (p[ch] < min) min = p[ch];
    if (p[ch] > max) max = p[ch];
  }
  return max - min;
}

function averageColor(pixels: RGB[]): RGB {
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  for (const p of pixels) {
    rSum += p.r;
    gSum += p.g;
    bSum += p.b;
  }
  const n = pixels.length || 1;
  return {
    r: Math.round(rSum / n),
    g: Math.round(gSum / n),
    b: Math.round(bSum / n),
  };
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length <= 1) {
    return [averageColor(pixels)];
  }

  const rR = channelRange(pixels, "r");
  const gR = channelRange(pixels, "g");
  const bR = channelRange(pixels, "b");

  const ch: "r" | "g" | "b" =
    rR >= gR && rR >= bR ? "r" : gR >= bR ? "g" : "b";

  pixels.sort((a, b) => a[ch] - b[ch]);
  const mid = pixels.length >> 1;

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract a palette of `count` prominent colors from an image URL.
 * Returns hex strings sorted by vibrancy (most vibrant first).
 */
export async function extractColors(
  src: string,
  count = 5
): Promise<string[]> {
  const img = await loadImage(src);
  const pixels = getPixels(img);
  if (pixels.length === 0) return [];

  const depth = Math.ceil(Math.log2(Math.max(count, 2)));
  const buckets = medianCut([...pixels], depth);

  return buckets
    .sort((a, b) => vibrancy(b) - vibrancy(a))
    .slice(0, count)
    .map(rgbToHex);
}

/**
 * Extract the single most vibrant color from an image.
 * Returns a hex string, or `null` on failure.
 */
export async function extractDominantColor(
  src: string
): Promise<string | null> {
  try {
    const colors = await extractColors(src, 8);
    return colors[0] ?? null;
  } catch {
    return null;
  }
}
