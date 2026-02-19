"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CurioLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pin.trim()) {
      setError("Enter your PIN");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Wrong PIN");
      setPin("");
      return;
    }

    router.replace("/curio");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-bg">
            <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.1" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Curio</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your PIN to continue
          </p>
        </div>

        <div>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="PIN"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] text-text placeholder:text-text-tertiary placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {error && (
            <p className="mt-3 text-center text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-base font-bold text-black transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : (
              "Enter"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
