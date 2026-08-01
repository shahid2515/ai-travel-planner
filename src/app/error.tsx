"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Without this, anything thrown in a server component — a database blip, a
 * malformed saved payload — renders Next.js's raw error screen. This keeps the
 * user inside the app and gives them the one thing that usually works: retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production the message is stripped client-side; the digest is what
    // ties this to the server log.
    console.error("[boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto grid w-full max-w-6xl place-items-center px-5 py-28 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Something broke</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          That didn&apos;t load properly
        </h1>
        <p className="mt-3 text-ink-soft">
          Usually a hiccup reaching the database or the model provider. Trying again is worth a
          shot — your saved trips are untouched.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/trips" className="btn btn-ghost">
            Saved trips
          </Link>
          <Link href="/" className="btn btn-ghost">
            Plan a trip
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-xs text-muted">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
