"use client";

import { EventType } from "./types";

let anonymousId: string | null = null;

function getAnonymousId(): string {
  if (anonymousId) return anonymousId;
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem("curio_uid");
  if (stored) {
    anonymousId = stored;
    return stored;
  }
  anonymousId = crypto.randomUUID();
  localStorage.setItem("curio_uid", anonymousId);
  return anonymousId;
}

interface QueuedEvent {
  user_id: string;
  item_id: string;
  type: EventType;
  ts: string;
  data?: Record<string, unknown>;
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  try {
    // TODO: persist analytics events to local DB if needed
    console.debug(`[analytics] flushed ${batch.length} events`);
  } catch {
    queue.unshift(...batch);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 5000);
}

export function trackEvent(
  itemId: string,
  type: EventType,
  data?: Record<string, unknown>
) {
  queue.push({
    user_id: getAnonymousId(),
    item_id: itemId,
    type,
    ts: new Date().toISOString(),
    data,
  });
  scheduleFlush();
}

export function trackImpression(itemId: string) {
  trackEvent(itemId, "impression");
}

export function trackOpen(itemId: string) {
  trackEvent(itemId, "open_item");
}

export function trackDwell(itemId: string, durationMs: number) {
  trackEvent(itemId, "dwell", { duration_ms: durationMs });
}
