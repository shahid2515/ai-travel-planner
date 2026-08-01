"use client";

import dynamic from "next/dynamic";
import type { MapStop } from "@/lib/trip-utils";

/**
 * Picks a map implementation:
 *   Google Maps  when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
 *   Leaflet + OpenStreetMap  otherwise — no key, no billing account
 *
 * Both are loaded lazily and client-side only. Leaflet touches `window` on
 * import, and there is no reason to ship either bundle to someone who never
 * scrolls to the map.
 */

const HAS_GOOGLE = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const Skeleton = () => <div className="h-full w-full animate-pulse bg-sunk" />;

const GoogleTripMap = dynamic(() => import("./GoogleTripMap"), {
  ssr: false,
  loading: Skeleton,
});

const LeafletTripMap = dynamic(() => import("./LeafletTripMap"), {
  ssr: false,
  loading: Skeleton,
});

export default function TripMap({
  stops,
  center,
  className = "",
  focusedKey = null,
  onSelect,
}: {
  stops: MapStop[];
  center: { lat: number; lng: number } | null;
  className?: string;
  /** Stop the timeline asked the map to highlight, if any. */
  focusedKey?: string | null;
  onSelect?: (key: string | null) => void;
}) {
  if (!center) {
    return (
      <div
        className={`grid place-items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-sunk p-8 text-center ${className}`}
      >
        <div>
          <p className="text-sm font-semibold">Map unavailable</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            The destination could not be located, so there is nothing to plot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line ${className}`}
    >
      {HAS_GOOGLE ? (
        <GoogleTripMap stops={stops} center={center} focusedKey={focusedKey} onSelect={onSelect} />
      ) : (
        <LeafletTripMap stops={stops} center={center} focusedKey={focusedKey} onSelect={onSelect} />
      )}
    </div>
  );
}
