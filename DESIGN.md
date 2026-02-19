# X Smoke Shop — Visual Discovery Platform

**Design Document**
**Source:** [ChatGPT Conversation](https://chatgpt.com/share/69967e42-f06c-8008-883f-e59d576f6094)
**Date:** February 18, 2026
**Client:** X Smoke Shop, 804 W. Shore Dr, Richardson, TX

---

## Architecture

Two separate products sharing a Supabase backend:

1. **Website** (Next.js) — public, customer-facing discovery feed where people browse
2. **Owner App** (React Native / Expo) — private, for the shop owner to snap photos and manage inventory

---

## Message 1 — USER

I want to design a website and a mobile app where the store owner can snap a picture of an item when he feels like it and the site dynamically reconfigures the masonry like layout for maximum engagement. There is no buy option i just want to maximize time on the site.

---

## Message 2 — ASSISTANT

Got it — you're basically building a "visual discovery" product: the owner drip-feeds inventory by taking photos, and your UI continuously reshuffles cards in a masonry grid to keep people scrolling (no checkout friction, purely engagement).

Here's a concrete blueprint you can build.

### 1) Core concept: engagement-first masonry

You want a Pinterest-style masonry feed, but not static. Each item card gets a **score** (what's likely to keep people engaged), and the layout engine uses that score to decide:
- **size** (1x / 2x / featured)
- **position** (top-of-feed rotation, "recency boosts")
- **sequencing** (interleaving categories/colors/styles so it feels fresh)
- **re-ranking** (periodic reshuffles without feeling random)

#### Minimal content per item

When the owner snaps a picture, you should capture:
- image(s)
- optional title/price tag (even if not purchasable, price curiosity keeps time-on-site)
- category (optional)
- condition (optional)
- short "hook" (optional; can be AI-suggested)
- created_at + store_id
- derived metadata (auto)

#### Derived metadata (automatic, key for dynamic layout)

Run a simple pipeline after upload:
- **image quality** (blur, brightness, resolution)
- **dominant colors** (for aesthetic mixing)
- **embedding** (so you can cluster similar items and avoid "boring streaks")
- **tags** (optional: "boots", "vintage", "leather")

This metadata enables "smart mixing" and "similar items" rails.

---

### 2) How to reconfigure the feed without feeling chaotic

People hate "the feed moved under my finger." The trick is:

#### A) Re-rank only at safe moments
- on initial load
- when user returns to top
- at pagination boundaries ("load more")
- or after a short idle (e.g., 3–5s) and only for *below-the-fold* items

#### B) Use soft reshuffles (not full randomization)
Instead of shuffling everything, do:
- keep top N stable
- re-order the next batch with diversity rules
- inject 1 "featured" card every ~8–15 cards
- rotate featured items every X minutes for different users

#### C) Add "micro-novelty" mechanics
These reliably increase session length:
- "Today's Finds" (small curated set)
- "Similar vibes" (one-click rabbit holes)
- "Color story" (tap a palette chip -> feed reconfigures)
- "Near you / from this store" (if multi-store later)

---

### 3) Scoring: what "maximum engagement" means operationally

You can do this with a simple scoring function first, then graduate to ML later.

#### Events to track (minimum viable analytics)
- impression (card entered viewport for >300ms)
- click/tap open detail
- dwell time on detail
- scroll depth
- saves/likes (even if not buying, "save" is huge)
- share
- "back" behavior (did they keep browsing?)

#### Initial engagement score (hand-tuned)

For item *i*:

**score(i) =**
- \+ recency_boost
- \+ ctr_weight × expected_CTR
- \+ dwell_weight × expected_dwell
- \+ novelty_weight × (1 − similarity_to_recently_seen)
- \+ diversity_bonus (category/color balancing)
- − fatigue_penalty (shown too often)

Expected CTR/dwell can start as:
- global averages per tag/category
- plus image-quality bonus (sharp + well-lit items do better)

#### Cold start (new items, no data)
Give new uploads a temporary boost:
- "new item exploration" for first ~200–500 impressions
Then decay toward normal performance.

---

### 4) Layout mechanics (masonry + variable emphasis)

A normal masonry layout just packs columns. You want **masonry + editorial weighting**:

#### Card types
- Standard (1 unit)
- Tall (1×2) — for striking images
- Wide/Featured (2 columns) — for high-score or new arrivals
- "Collection" card — a cluster of 3–6 similar items (creates rabbit holes)

#### Packing approach
- Pick the next K items by score and diversity constraints
- Assign a size class (standard/tall/featured)
- Pack into columns with a "best-fit" heuristic (minimize height difference)
- Freeze positions above fold, re-pack below fold when needed

On web, this is straightforward.
On mobile, you can do 2-column masonry with occasional full-width cards.

---

### 5) Owner workflow: "snap whenever" with almost zero friction

#### Owner app flow (10 seconds)
1. open camera
2. snap
3. optional: type a 1-line caption (or choose AI suggestions)
4. publish

Everything else (tags, colors, "vibe", quality checks) happens async.

Add "drafts" so they can snap multiple items offline and publish later.

---

### 6) Architecture you can ship quickly

#### Frontend
- Web: Next.js + virtualized masonry feed (infinite scroll)
- Mobile: React Native (or Swift/Kotlin if you want native camera polish)
- Shared design language (cards, detail view, collections)

#### Backend
- Postgres (items, events, stores)
- Object storage for images (S3 or equivalent) + CDN
- Worker queue for image processing + embeddings
- Re-ranking service (can be a simple API endpoint)

#### Data loop (critical)
- Client sends events
- Backend aggregates metrics per item (CTR, dwell, etc.)
- Ranking endpoint returns ordered IDs + size hints
- Client packs into masonry grid

---

### 7) MVP feature set (what I'd build first)

**Phase 1 (ship fast)**
- Owner: photo upload + caption + publish
- User: infinite masonry feed + detail view
- Basic ranking: recency + mild diversity + featured injection
- Analytics: impressions, opens, dwell, scroll depth

**Phase 2 (make it sticky)**
- save/like + "saved feed"
- "similar items" via embeddings
- collections / "vibes"
- personalization (lightweight: learn preferred categories/colors)

**Phase 3 (serious engagement engine)**
- multi-armed bandit for exploration vs exploitation
- per-user ranking
- A/B testing of reshuffle cadence and featured frequency

---

### 8) Key UX tricks to maximize time-on-site (without being gross)
- Fast image loading (blur-up placeholders, aggressive caching)
- Detail view that encourages "next" (swipe to next item)
- "You might like" carousel at bottom of detail
- "Back to feed" keeps your scroll position (don't reset users)
- Subtle progress cues ("20 new finds" pill that appears after you scroll)

---

## Message 3 — USER

I know I want to do react native at least

---

## Message 4 — ASSISTANT

React Native is a great fit here, especially because camera + fast iteration matters more than pixel-perfect native feel.

Here's a solid RN-first plan (with enough specifics to actually build it).

### Recommended stack (RN-first, engagement feed)

**Mobile (Owner App)**
- React Native (Expo to start, unless you need heavy native modules)
- `react-native-vision-camera` (best camera UX) or Expo Camera (fastest MVP)
- `react-native-reanimated` + `react-native-gesture-handler` (smooth feed + swipe detail)
- Masonry: `@shopify/flash-list` + a masonry implementation (fast + virtualized)

**Backend**
- Postgres + Storage (Supabase is perfect for this)
- Edge/Server functions for:
  - ingest (upload finalize)
  - ranking API
  - event collection
- Worker for image processing (Supabase + a worker, or a tiny Node/Python service)

**Image processing**
- Generate:
  - blurhash / thumb
  - dominant colors
  - embeddings (later, but you can design for it now)

---

### App structure (2 apps, or 1 app with roles)

You'll likely want:
1. **Owner mode**: snap → publish
2. **Viewer mode**: scroll → open → dwell

You can ship as:
- one app with "owner login" unlocking camera/publish
- OR separate "Owner" and "Shop" apps (cleaner long-term)

---

### Mobile feed: masonry + "smart reshuffle"

#### Key rules so the feed feels good
- Never move cards above where the user has already scrolled.
- Re-rank only:
  - on initial load
  - when loading the next page
  - when user pulls-to-refresh

#### What the ranking endpoint should return

Instead of just item IDs, return layout hints:

```json
{
  "items": [
    { "id": "123", "size": "standard" },
    { "id": "456", "size": "tall" },
    { "id": "789", "size": "featured" }
  ],
  "nextCursor": "abc"
}
```

Then RN packs those into masonry columns.

#### Card sizes (simple and effective)
- **standard**: 1 column, normal height
- **tall**: 1 column, ~1.6× height
- **featured**: full width (2 columns) every ~10 cards

That "featured every ~10" pattern alone increases time-on-site because it creates rhythm.

---

### Owner workflow (RN)

#### Minimal screens
1. **Camera screen** — snap photo, optional crop
2. **Publish screen** — caption (optional), "Publish" button
3. **My uploads** (optional) — drafts, recent posts

#### Upload flow (important for speed)
- Upload original photo to storage
- Immediately create an "item" row with status=`processing`
- Background worker generates thumbnail + blurhash + metadata
- Viewer feed uses thumbnail + blurhash first, swaps to full later

This keeps the owner experience instant.

---

### Analytics you need on day 1 (so "maximize engagement" is real)

Track these events from the viewer site:

- `impression` (entered viewport > 300ms)
- `open_item`
- `dwell` (time on detail view)
- `scroll_depth`
- `share` (if you add it)
- `save` (if you add it)

Your "score" per item can start simple:
- boost new items for exploration
- boost items with higher CTR/dwell
- diversify by not showing too many similar colors/categories in a row

---

### MVP build order (fastest path)

**Week 1 MVP**
- Supabase: tables (stores, items, events)
- Owner RN: camera → upload → publish
- Viewer website: masonry feed → detail view
- Ranking v0: newest-first + featured injection

**Week 2 "engagement"**
- event tracking
- ranking v1: recency + CTR + diversity
- similar-items rail (optional if embeddings are ready)

---

### Concrete database sketch

**items**
- id
- store_id
- image_url, thumb_url, blurhash
- caption
- created_at
- status (processing/ready)
- metadata: dominant_color, aspect_ratio, quality_score
- metrics: impressions, opens, avg_dwell, ctr (materialized/aggregated)

**events**
- id
- user_id (anonymous ok)
- item_id
- type
- ts
- data (json)

You can aggregate events into item metrics on a schedule or stream.

---

## Message 5 — USER

What do we call it?

---

## Message 6 — ASSISTANT

A good name should hint at: **snap → drop into a dynamic "gallery" → endless browse**. Here are some strong options, grouped by vibe, plus my top picks.

### Top picks (memorable + on-theme)
- **SnapShelf** (owner snaps, it lands on a shelf)
- **DropGallery** (upload = "drop", users browse a gallery)
- **MasonryMuse** (directly references the layout + discovery)
- **WanderRack** (aimed at "keep browsing")
- **PulseDisplay** (feed constantly "pulses" / refreshes)

### Clean + brandable (easy to trademark/domain-check later)
- **Vitrina** (shop window in Spanish/Italian vibe)
- **Glint** (quick, visual, discovery)
- **Curio** / **CurioGrid**
- **Tally** (as in tallying interest/time)
- **Loomi** / **LumaRack**

### More "storefront" flavored
- **Windowwalk**
- **ShopWindow**
- **Showcase**
- **Displayry**
- **ShelfSpace**

### More "scroll / discovery" flavored
- **WanderGrid**
- **DriftFeed**
- **Scrollroom**
- **StumbleShelf**
- **LoopGallery**

### If you want it to sound a bit premium / artsy
- **GalleryMode**
- **VibeVault**
- **Arcade Gallery** (if you want playful)
- **Exhibitly**
- **MuseWall**

#### My vote
If you want something that instantly communicates the product without being cringe:
- **SnapShelf** (best "explains itself")
- **DropGallery** (best "mechanic" name)
- **Vitrina** (best premium brand)

---

## Message 7 — USER

This is a one off for X Smoke Shop https://maps.app.goo.gl/8u2fW9FxrbDtCYRCA?g_st=ic

But later we can market it to other smoke shops with a customizable design.

---

## Message 8 — ASSISTANT

Since this is a one-off for **X Smoke Shop in Richardson** (804 W. Shore Dr; opened March 10 per local coverage), but you eventually want to sell the *system* to other smoke shops, I'd name it with a **2-layer brand**:

- **Customer-facing (per shop):** something that feels like *their* digital display wall
- **Product/platform (for you):** something generic + brandable for white-label

### Customer-facing name ideas for this client (X Smoke Shop)

These keep their "X" identity and fit the "scrollable gallery" concept:

1. **X Showcase**
2. **X Gallery**
3. **X Wall** (short, modern; "the wall" is intuitive for masonry feeds)
4. **X Finds** (more playful / discovery)
5. **X Drops** (fits "snap and drop" inventory)

If you want it to sound more premium:
- **X Vitrina** ("shop window" vibe)

### Your scalable/white-label platform name ideas

These are meant to work across many shops without sounding "smoke shop specific":

1. **SnapShelf** (very literal: snap → shelf/feed)
2. **DropGallery** (mechanic is the brand)
3. **WanderGrid** (engagement-first scrolling)
4. **Windowwalk** (digital storefront browsing)
5. **MuseWall** (more aesthetic / premium)

### The cleanest brand architecture
- Platform: **SnapShelf**
- For this client: **X Showcase powered by SnapShelf**

That reads well on a footer, in an App Store listing, and in future sales outreach.

---

## Business Details (from Yelp / Community Impact)

- **Name:** X Smoke Shop
- **Address:** 804 W. Shore Dr, Richardson, TX
- **Phone:** (214) 272-7617
- **Instagram:** [@xsmokeshop1](https://instagram.com/xsmokeshop1)
- **Opened:** March 10, 2025
- **Products:** Smoke and vape accessories, hookah, pipes, vaporizers
- **Hours:**
  - Mon: 12 PM – 2 AM
  - Tue: 11:30 AM – 2 AM
  - Wed: 12 PM – 12:30 AM
  - Thu: 12 PM – 12 AM
  - Fri: 12 PM – 12:30 AM
  - Sat: 12 PM – 2 AM
  - Sun: 12 PM – 1 AM
