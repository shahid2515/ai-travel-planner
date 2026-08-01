import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { resolveProvider } from "@/lib/llm";
import { placesProviderLabel } from "@/lib/places";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Social cards need absolute URLs. Vercel exposes the deployment host at build
// time; falls back to localhost so previews work in development too.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wayfare — AI Travel Planner",
    template: "%s · Wayfare",
  },
  description:
    "Pick a destination and a budget, and get a costed day-by-day itinerary with real places, restaurants and a map.",
  openGraph: {
    type: "website",
    siteName: "Wayfare",
    title: "Wayfare — AI Travel Planner",
    description:
      "A costed, day-by-day itinerary in about thirty seconds — with every venue checked against a real place database.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const provider = resolveProvider();
  const places = placesProviderLabel();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                W
              </span>
              <span className="text-[17px] font-semibold tracking-tight">Wayfare</span>
            </Link>

            <nav className="flex items-center gap-1.5 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-ink-soft transition hover:bg-sunk hover:text-ink"
              >
                Plan a trip
              </Link>
              <Link
                href="/trips"
                className="rounded-lg px-3 py-2 text-ink-soft transition hover:bg-sunk hover:text-ink"
              >
                Saved trips
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            {/* Named from the live config rather than hardcoded, so the footer
                cannot drift out of date the way it just did. */}
            <p>
              Wayfare — a portfolio build. Next.js, {provider?.label ?? "demo data"}, {places}.
            </p>
            <p className="font-mono text-xs">Itineraries are AI-generated. Check opening times.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
