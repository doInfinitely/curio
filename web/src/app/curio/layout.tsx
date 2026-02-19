"use client";

import { usePathname, useRouter } from "next/navigation";

export default function CurioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/curio/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/curio/login");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-base font-extrabold tracking-tight">Curio</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-red-400"
        >
          Sign Out
        </button>
      </header>
      <main className="flex-1">{children}</main>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
