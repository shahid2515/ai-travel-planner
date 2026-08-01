import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Wayfare — AI Travel Planner",
    template: "%s · Wayfare",
  },
  description:
    "Pick a destination and a budget, and get a costed day-by-day itinerary with real places, restaurants and a map.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
            <p>Wayfare — a portfolio build. Next.js, OpenAI Structured Outputs, Google Places.</p>
            <p className="font-mono text-xs">Itineraries are AI-generated. Check opening times.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
