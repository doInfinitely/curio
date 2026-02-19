export type ItemStatus = "processing" | "ready" | "hidden";

export type CardSize = "standard" | "tall" | "featured";

export interface Item {
  id: string;
  store_id: string;
  image_url: string;
  thumb_url: string | null;
  blurhash: string | null;
  caption: string | null;
  created_at: string;
  status: ItemStatus;
  aspect_ratio: number;
  dominant_color: string | null;
  quality_score: number;
  impressions: number;
  opens: number;
  avg_dwell: number;
  ctr: number;
}

export interface FeedItem extends Item {
  size: CardSize;
  score: number;
}

export type EventType =
  | "impression"
  | "open_item"
  | "dwell"
  | "scroll_depth"
  | "save"
  | "share";

export interface AnalyticsEvent {
  user_id: string;
  item_id: string;
  type: EventType;
  ts: string;
  data?: Record<string, unknown>;
}
