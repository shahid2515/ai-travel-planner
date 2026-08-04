import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { resolveProvider } from "@/lib/llm";
import { placesProviderLabel } from "@/lib/places";
import "./globals.css";

/**
 * IBM Plex rather than Geist.
 *
 * Geist is the typeface `create-next-app` ships with, so it silently signals
 * "untouched template" to anyone who builds with Next.js. Plex was drawn for
 * technical documentation, the sans and mono are designed as a pair, and the
 * mono is doing real work here — labels, times, costs and IDs all sit in it.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-ground/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid h-6 w-6 place-items-center rounded bg-brand font-mono text-[11px] font-bold text-[#05100c]">
                W
              </span>
              <span className="font-mono text-[13px] font-medium tracking-[0.14em] uppercase">
                Wayfare
              </span>
            </Link>

            <nav className="flex items-center gap-6 font-mono text-[12px] tracking-wide">
              <Link href="/" className="text-muted transition hover:text-brand">
                plan
              </Link>
              <Link href="/trips" className="text-muted transition hover:text-brand">
                saved
              </Link>
              <a
                href="https://github.com/shahid2515/ai-travel-planner"
                target="_blank"
                rel="noreferrer"
                className="text-muted transition hover:text-brand"
              >
                source
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Spec-sheet footer: labelled columns, values in mono, read from the
            live configuration so it cannot drift out of date. */}
        <footer className="border-t border-line bg-sunk">
          <div className="mx-auto w-full max-w-6xl px-5 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="label">Runtime</p>
                <p className="font-mono text-[13px] text-ink-soft">Next.js 16 · React 19</p>
                <p className="font-mono text-[13px] text-ink-soft">Postgres · Prisma</p>
              </div>
              <div>
                <p className="label">Generation</p>
                <p className="font-mono text-[13px] text-ink-soft">
                  {provider ? provider.label : "demo data"}
                </p>
                <p className="font-mono text-[13px] text-muted">
                  {provider ? provider.model : "no key configured"}
                </p>
              </div>
              <div>
                <p className="label">Verification</p>
                <p className="font-mono text-[13px] text-ink-soft">{places}</p>
                <p className="font-mono text-[13px] text-muted">every venue re-queried</p>
              </div>
              <div>
                <p className="label">Caveat</p>
                <p className="text-[13px] leading-relaxed text-muted">
                  Itineraries are model-generated. Opening hours and prices change — check
                  before you book.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-[11px] tracking-wide text-muted">
              <span>WAYFARE — AI TRAVEL PLANNER</span>
              <a
                href="https://github.com/shahid2515/ai-travel-planner"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-brand"
              >
                github.com/shahid2515/ai-travel-planner
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
