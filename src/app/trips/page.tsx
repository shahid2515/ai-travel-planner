import type { Metadata } from "next";
import Link from "next/link";
import { getOwnerId } from "@/lib/session";
import { listTrips } from "@/lib/trips";
import { formatDate, formatMoney, photoSrc, relativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved trips" };

export default async function TripsPage() {
  const ownerId = await getOwnerId();
  const trips = await listTrips(ownerId);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Saved trips</h1>
          <p className="mt-2 text-ink-soft">
            {trips.length
              ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} saved on this browser.`
              : "Everything you generate is saved here automatically."}
          </p>
        </div>
        <Link href="/" className="btn btn-primary">
          Plan a new trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="card mt-10 grid place-items-center px-6 py-20 text-center">
          <div className="max-w-sm">
            <p className="text-lg font-semibold">No trips yet</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Pick a destination and a budget on the home page and the first itinerary will land
              here in about thirty seconds.
            </p>
            <Link href="/" className="btn btn-primary mt-6">
              Start planning
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const photo = photoSrc(trip.heroPhoto, 600);
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={trip.city}
                    loading="lazy"
                    className="h-36 w-full bg-sunk object-cover"
                  />
                ) : (
                  <div className="h-36 w-full bg-gradient-to-br from-brand-wash to-sunk" />
                )}

                <div className="p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    {trip.city}
                    {trip.country ? `, ${trip.country}` : ""}
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight group-hover:text-brand">
                    {trip.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {trip.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
                    <span>
                      {trip.startDate ? formatDate(trip.startDate) : `${trip.days} days`}
                      {trip.startDate ? ` · ${trip.days}d` : ""}
                    </span>
                    <span>{formatMoney(trip.budget, trip.currency)}</span>
                    <span>
                      {trip.travelers} {trip.travelers === 1 ? "traveller" : "travellers"}
                    </span>
                    <span className="ml-auto">{relativeDate(trip.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
