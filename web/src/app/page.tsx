import { BubbleFeed } from "@/components/bubble-feed";
import { STORE } from "@/lib/store";

export default function Home() {
  return (
    <main className="relative" style={{ height: "calc(100dvh - 56px)" }}>
      <div className="pointer-events-none absolute inset-x-0 top-5 z-10 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-lg">
          Discover what&apos;s new
        </h2>
        <p className="mt-1 text-xs text-text-secondary drop-shadow-md">
          Drag to play &middot; tap to explore &middot; {STORE.name}
        </p>
      </div>
      <BubbleFeed />
    </main>
  );
}
