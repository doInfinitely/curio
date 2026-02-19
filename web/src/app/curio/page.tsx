"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";

interface DbItem {
  id: number;
  image_path: string;
  caption: string | null;
  dominant_color: string | null;
  created_at: string;
  status: string;
}

type UploadState = "idle" | "preview" | "publishing" | "done";

export default function CurioPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  // PIN change state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pinError, setPinError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to load items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadState("preview");
  };

  const handleDiscard = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setCaption("");
    setUploadState("idle");
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!imageFile) return;
    setUploadState("publishing");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setUploadState("done");
      setTimeout(() => {
        handleDiscard();
        loadItems();
      }, 1200);
    } catch (err) {
      console.error("Publish failed:", err);
      setUploadState("preview");
    }
  };

  const handleDelete = async (item: DbItem) => {
    setDeleting(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  if (uploadState === "preview" || uploadState === "publishing") {
    return (
      <div className="px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleDiscard}
            disabled={uploadState === "publishing"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-bold">New Item</h2>
          <div className="w-10" />
        </div>

        {imagePreview && (
          <div className="relative mb-6 aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 120))}
          placeholder="Add a caption (optional)"
          rows={2}
          className="mb-1 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mb-6 text-right text-[11px] text-text-tertiary">
          {caption.length}/120
        </p>

        <button
          onClick={handlePublish}
          disabled={uploadState === "publishing"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-base font-bold text-black transition-opacity disabled:opacity-50"
        >
          {uploadState === "publishing" ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          ) : (
            "Publish"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilePick}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFilePick}
        className="hidden"
      />

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-bold text-black"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          Take Photo
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-elevated py-3.5 text-sm font-semibold"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18z" />
          </svg>
          Gallery
        </button>
      </div>

      {uploadState === "done" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3">
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-green-400">Published!</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center pt-16 text-center">
          <svg className="h-12 w-12 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18z" />
          </svg>
          <p className="mt-4 font-semibold text-text-secondary">No items yet</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Snap your first photo to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-surface">
              <Image
                src={item.image_path}
                alt={item.caption || "Item"}
                fill
                sizes="33vw"
                className="object-cover"
                unoptimized
              />
              <button
                onClick={() => handleDelete(item)}
                disabled={deleting === item.id}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:opacity-100"
                style={{ opacity: deleting === item.id ? 1 : undefined }}
              >
                {deleting === item.id ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                )}
              </button>
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                  <p className="truncate text-[11px] font-medium text-white">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Change PIN ─────────────────────────────── */}
      <div className="mt-10 border-t border-border pt-6 pb-8">
        <h3 className="mb-4 text-sm font-bold text-text-secondary">Change PIN</h3>
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="Current PIN"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="New PIN"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {pinError && (
            <p className="text-sm text-red-400">{pinError}</p>
          )}
          {pinStatus === "saved" && (
            <p className="text-sm text-green-400">PIN updated.</p>
          )}
          <button
            onClick={async () => {
              setPinError("");
              setPinStatus("saving");
              try {
                const res = await fetch("/api/auth", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentPin, newPin }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed");
                }
                setPinStatus("saved");
                setCurrentPin("");
                setNewPin("");
                setTimeout(() => setPinStatus("idle"), 2000);
              } catch (err) {
                setPinError(err instanceof Error ? err.message : "Failed");
                setPinStatus("error");
              }
            }}
            disabled={pinStatus === "saving" || !currentPin || !newPin}
            className="w-full rounded-xl bg-surface-elevated py-3 text-sm font-semibold text-text transition-opacity disabled:opacity-40"
          >
            {pinStatus === "saving" ? "Saving..." : "Update PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
