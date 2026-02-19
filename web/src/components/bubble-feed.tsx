"use client";

import { useRef, useEffect, useState } from "react";
import type { Item } from "@/lib/types";

// ── Sizes ──────────────────────────────────────────────
const RADII = [100, 80, 64, 54, 46];

function pickRadius(i: number, total: number): number {
  if (i === 0) return RADII[0];
  if (i < total * 0.1) return RADII[1];
  if (i < total * 0.3) return RADII[2];
  if (i < total * 0.6) return RADII[3];
  return RADII[4];
}

// ── Physics tuning ─────────────────────────────────────
const DAMPING = 0.93;
const CENTER_GRAVITY = 0.00035;
const COLLISION_K = 0.38;
const PUSH_RANGE = 220;
const PUSH_K = 0.12;
const IDLE_AMP = 0.012;
const IDLE_FREQ = 0.0007;
const WALL_BOUNCE = -0.35;
const DRAG_SPRING = 0.32;
const THROW_MULT = 2.8;

// ── Types ──────────────────────────────────────────────
interface Bubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
  phase: number;
  item: Item;
  color: string;
  img: HTMLImageElement | null;
  loaded: boolean;
}

interface Drag {
  bubble: Bubble;
  ox: number;
  oy: number;
  t0: number;
}

// ── Random vibrant color ───────────────────────────────
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomHexColor(): string {
  const h = Math.random() * 360;
  const s = 55 + Math.random() * 30;
  const l = 50 + Math.random() * 15;
  return hslToHex(h, s, l);
}

// ── Physics step ───────────────────────────────────────
function physics(
  bubbles: Bubble[],
  w: number,
  h: number,
  dragged: Bubble | null,
  t: number,
) {
  const cx = w / 2;
  const cy = h * 0.46;

  for (const b of bubbles) {
    if (b === dragged) continue;
    const dx = cx - b.x;
    const dy = cy - b.y;
    const d = Math.hypot(dx, dy) || 1;
    const g = d * CENTER_GRAVITY;
    b.vx += (dx / d) * g;
    b.vy += (dy / d) * g;
    b.vx += Math.sin(t * IDLE_FREQ + b.phase) * IDLE_AMP;
    b.vy += Math.cos(t * IDLE_FREQ * 0.73 + b.phase + 1.3) * IDLE_AMP;
  }

  for (let i = 0; i < bubbles.length; i++) {
    const a = bubbles[i];
    for (let j = i + 1; j < bubbles.length; j++) {
      const b = bubbles[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const gap = a.r + b.r + 3;

      if (d < gap) {
        const overlap = gap - d;
        const nx = dx / d;
        const ny = dy / d;
        const f = overlap * COLLISION_K;
        const tm = a.mass + b.mass;
        if (a !== dragged) {
          a.vx -= (nx * f * b.mass) / tm;
          a.vy -= (ny * f * b.mass) / tm;
        }
        if (b !== dragged) {
          b.vx += (nx * f * a.mass) / tm;
          b.vy += (ny * f * a.mass) / tm;
        }
      }
    }

    const speed = Math.hypot(a.vx, a.vy);
    if (speed > 2.5) {
      for (let j = 0; j < bubbles.length; j++) {
        if (i === j) continue;
        const b = bubbles[j];
        if (b === dragged) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < PUSH_RANGE) {
          const falloff = 1 - d / PUSH_RANGE;
          const f = falloff * falloff * PUSH_K * speed;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }
    }
  }

  for (const b of bubbles) {
    if (b === dragged) continue;
    b.vx *= DAMPING;
    b.vy *= DAMPING;
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < b.r) { b.x = b.r; b.vx *= WALL_BOUNCE; }
    if (b.x > w - b.r) { b.x = w - b.r; b.vx *= WALL_BOUNCE; }
    if (b.y < b.r) { b.y = b.r; b.vy *= WALL_BOUNCE; }
    if (b.y > h - b.r) { b.y = h - b.r; b.vy *= WALL_BOUNCE; }
  }
}

// ── Renderer ───────────────────────────────────────────
function render(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  w: number,
  h: number,
  dpr: number,
  dragged: Bubble | null,
) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const sorted = [...bubbles].sort((a, b) => b.r - a.r);

  for (const b of sorted) {
    const active = b === dragged;

    // glow ring
    ctx.save();
    const glowR = b.r + (active ? 18 : 10);
    const glow = ctx.createRadialGradient(b.x, b.y, b.r, b.x, b.y, glowR);
    glow.addColorStop(0, active ? b.color + "55" : b.color + "22");
    glow.addColorStop(1, b.color + "00");
    ctx.beginPath();
    ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.restore();

    // clipped circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (b.loaded && b.img) {
      const iw = b.img.naturalWidth;
      const ih = b.img.naturalHeight;
      const crop = Math.min(iw, ih);
      ctx.drawImage(
        b.img,
        (iw - crop) / 2,
        (ih - crop) / 2,
        crop,
        crop,
        b.x - b.r,
        b.y - b.r,
        b.r * 2,
        b.r * 2,
      );
    } else {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }

    // caption inside large circles
    if (b.r >= 64 && b.item.caption) {
      const grad = ctx.createLinearGradient(b.x, b.y + b.r * 0.15, b.x, b.y + b.r);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = grad;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);

      ctx.fillStyle = "#fff";
      ctx.font = `600 ${b.r >= 90 ? 13 : 11}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const maxW = b.r * 1.5;
      let txt = b.item.caption;
      while (ctx.measureText(txt).width > maxW && txt.length > 4) {
        txt = txt.slice(0, -1);
      }
      if (txt !== b.item.caption) txt += "\u2026";
      ctx.fillText(txt, b.x, b.y + b.r - 8, maxW);
    }

    ctx.restore();

    // border ring
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.strokeStyle = active
      ? b.color
      : b.color + "40";
    ctx.stroke();
  }

  ctx.restore();
}

// ── Build bubbles from DB items ─────────────────────────

interface DbItem {
  id: number;
  image_path: string;
  caption: string | null;
  created_at: string;
  dominant_color: string | null;
}

function buildBubbles(dbItems: DbItem[], w: number, h: number): Bubble[] {
  const total = dbItems.length;
  if (total === 0) return [];

  const bubbles: Bubble[] = [];

  for (let i = 0; i < total; i++) {
    const r = pickRadius(i, total);
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.4;
    const edgeDist = Math.max(w, h) * 0.65;

    const db = dbItems[i];
    const color = db.dominant_color || randomHexColor();

    const item: Item = {
      id: String(db.id),
      store_id: "x-smoke-shop",
      image_url: db.image_path,
      thumb_url: db.image_path,
      blurhash: null,
      caption: db.caption,
      created_at: db.created_at,
      status: "ready",
      aspect_ratio: 1,
      dominant_color: color,
      quality_score: 1,
      impressions: 0,
      opens: 0,
      avg_dwell: 0,
      ctr: 0,
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = db.image_path;

    const bubble: Bubble = {
      id: item.id,
      x: w / 2 + Math.cos(angle) * edgeDist,
      y: h / 2 + Math.sin(angle) * edgeDist,
      vx: 0,
      vy: 0,
      r,
      mass: r * r,
      phase: Math.random() * Math.PI * 2,
      item,
      color,
      img,
      loaded: false,
    };

    img.onload = () => {
      bubble.loaded = true;
    };

    bubbles.push(bubble);
  }

  return bubbles;
}

// ── Component ──────────────────────────────────────────
export function BubbleFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [empty, setEmpty] = useState(false);
  const stateRef = useRef<{
    bubbles: Bubble[];
    drag: Drag | null;
    raf: number;
  }>({ bubbles: [], drag: null, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const state = stateRef.current;

    const resize = () => {
      const { width: w, height: h } = parent.getBoundingClientRect();
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    window.addEventListener("resize", resize);

    const rect = parent.getBoundingClientRect();

    fetch("/api/items")
      .then((r) => r.json())
      .then((items: DbItem[]) => {
        state.bubbles = buildBubbles(items, rect.width, rect.height);
        if (items.length === 0) setEmpty(true);
      })
      .catch(() => {
        setEmpty(true);
      });

    let running = true;
    const loop = () => {
      if (!running) return;
      const { width: w, height: h } = parent.getBoundingClientRect();
      const t = performance.now();
      physics(state.bubbles, w, h, state.drag?.bubble ?? null, t);
      render(ctx, state.bubbles, w, h, dpr, state.drag?.bubble ?? null);
      state.raf = requestAnimationFrame(loop);
    };
    loop();

    const pos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      const src =
        "touches" in e
          ? e.touches[0] ?? (e as TouchEvent).changedTouches[0]
          : e;
      return { x: (src?.clientX ?? 0) - r.left, y: (src?.clientY ?? 0) - r.top };
    };

    const hit = (px: number, py: number) => {
      const rev = [...state.bubbles].sort((a, b) => a.r - b.r);
      for (const b of rev) {
        if (Math.hypot(px - b.x, py - b.y) < b.r) return b;
      }
      return null;
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const p = pos(e);
      const b = hit(p.x, p.y);
      if (b) state.drag = { bubble: b, ox: p.x - b.x, oy: p.y - b.y, t0: Date.now() };
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      const d = state.drag;
      if (!d) return;
      e.preventDefault();
      const p = pos(e);
      const tx = p.x - d.ox;
      const ty = p.y - d.oy;
      d.bubble.vx = (tx - d.bubble.x) * DRAG_SPRING;
      d.bubble.vy = (ty - d.bubble.y) * DRAG_SPRING;
      d.bubble.x = tx;
      d.bubble.y = ty;
    };

    const onUp = () => {
      const d = state.drag;
      if (!d) return;
      d.bubble.vx *= THROW_MULT;
      d.bubble.vy *= THROW_MULT;
      state.drag = null;
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);
    canvas.addEventListener("touchcancel", onUp);

    return () => {
      running = false;
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      canvas.removeEventListener("touchcancel", onUp);
    };
  }, []);

  if (empty) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-border bg-surface px-8 py-10">
          <svg className="mx-auto h-10 w-10 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <p className="mt-4 text-base font-semibold text-text">No items yet</p>
          <p className="mt-1.5 text-sm text-text-secondary">
            New products are on the way — check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  );
}
