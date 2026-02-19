import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PaletteProvider } from "@/components/palette-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X Smoke Shop — See What's New",
  description:
    "Browse the latest drops at X Smoke Shop in Richardson, TX. Hookah, vapes, glass, and more.",
  openGraph: {
    title: "X Smoke Shop",
    description: "See what's new at X Smoke Shop, Richardson TX.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text-primary`}
      >
        <PaletteProvider>{children}</PaletteProvider>
      </body>
    </html>
  );
}
