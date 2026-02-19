import { Item, FeedItem, CardSize } from "./types";

const RECENCY_HALF_LIFE_HOURS = 48;
const CTR_WEIGHT = 2.0;
const DWELL_WEIGHT = 1.5;
const NOVELTY_WEIGHT = 1.0;
const DIVERSITY_BONUS = 0.5;
const FATIGUE_PENALTY = 0.3;
const NEW_ITEM_BOOST = 3.0;
const NEW_ITEM_THRESHOLD = 200;
const FEATURED_EVERY = 10;

function recencyBoost(createdAt: string): number {
  const ageHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return Math.exp(-ageHours / RECENCY_HALF_LIFE_HOURS);
}

function coldStartBoost(impressions: number): number {
  if (impressions < NEW_ITEM_THRESHOLD) {
    return NEW_ITEM_BOOST * (1 - impressions / NEW_ITEM_THRESHOLD);
  }
  return 0;
}

function scoreItem(item: Item, recentColors: string[]): number {
  const recency = recencyBoost(item.created_at);
  const ctrScore = CTR_WEIGHT * (item.ctr || 0);
  const dwellScore = DWELL_WEIGHT * Math.min((item.avg_dwell || 0) / 30, 1);
  const colorSimilarity = recentColors.includes(item.dominant_color ?? "")
    ? 1
    : 0;
  const novelty = NOVELTY_WEIGHT * (1 - colorSimilarity);
  const diversity = DIVERSITY_BONUS * (Math.random() * 0.4 + 0.8);
  const fatigue =
    FATIGUE_PENALTY * Math.min((item.impressions || 0) / 1000, 1);
  const coldStart = coldStartBoost(item.impressions || 0);

  return (
    recency + ctrScore + dwellScore + novelty + diversity - fatigue + coldStart
  );
}

function assignSize(item: FeedItem, index: number): CardSize {
  if (index > 0 && index % FEATURED_EVERY === 0) return "featured";
  if (item.aspect_ratio >= 1.3) return "tall";
  if (item.score > 0.7 && Math.random() > 0.5) return "tall";
  return "standard";
}

export function rankAndLayout(items: Item[]): FeedItem[] {
  const recentColors: string[] = [];

  const scored: FeedItem[] = items.map((item) => ({
    ...item,
    score: scoreItem(item, recentColors),
    size: "standard" as CardSize,
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, index) => {
    const size = assignSize(item, index);
    if (item.dominant_color) {
      recentColors.push(item.dominant_color);
      if (recentColors.length > 5) recentColors.shift();
    }
    return { ...item, size };
  });
}
