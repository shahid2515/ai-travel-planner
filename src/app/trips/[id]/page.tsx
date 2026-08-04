import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BudgetPanel from "@/components/trip/BudgetPanel";
import { PlaceCard, RestaurantCard } from "@/components/trip/PlaceCard";
import TripActions from "@/components/trip/TripActions";
import TripWorkspace from "@/components/trip/TripWorkspace";
import { placesProviderLabel } from "@/lib/places";
import { getTrip } from "@/lib/trips";
import { tripTotals } from "@/lib/trip-utils";
import { formatDate, photoSrc } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return { title: "Trip not found" };
  return { title: trip.trip.title, description: trip.trip.summary };
}

/**
 * A missing trip renders the not-found UI but returns HTTP 200, not 404.
 *
 * That is how Next.js behaves for any streamed response: the headers are sent
 * before the page discovers the row is missing, so the status can no longer be
 * changed. Next compensates by injecting <meta name="robots" content="noindex">
 * into the streamed HTML, which is verified present, so search engines do not
 * index dead trip links.
 *
 * Getting a real 404 would mean checking existence in `proxy` before the body
 * streams — a database round trip on every request to this route, for a status
 * code no user sees. Not worth it here. Revisit if these links ever need to be
 * crawled or monitored by status code.
 */

export default async function TripPage({ params }: Props) {
  const { id } = await params;
  const payload = await getTrip(id);
  if (!payload) notFound();

  const { trip, input, dates, destination } = payload;
  const hero = photoSrc(destination.photo, 1600);
  const { located, totalVenues, activities } = tripTotals(payload);

  const dateLine = dates.length
    ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
    : `${input.days} days, dates open`;

  return (
    <article className="pb-20">
      {/* Hero */}
      <header className="relative border-b border-line bg-[#060a09]">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={destination.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        {/* Fades the photograph into the page rather than cutting it with a
            hard edge — the join is what made it look pasted on. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ground via-[#060a09]/70 to-[#060a09]/30"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand">
            {destination.name}
            {destination.country ? `, ${destination.country}` : ""}
          </p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
            {trip.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/70">{trip.summary}</p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-white">
            {[
              ["When", dateLine],
              ["Who", `${input.travelers} ${input.travelers === 1 ? "traveller" : "travellers"}`],
              ["Pace", input.pace.charAt(0).toUpperCase() + input.pace.slice(1)],
              ["Plan", `${activities} stops across ${trip.days.length} days`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-14 px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/trips" className="text-sm font-semibold text-brand hover:underline">
            ← All saved trips
          </Link>
          <TripActions tripId={payload.id} />
        </div>

        {payload.demo && (
          <p className="rounded-xl border border-ember/30 bg-ember-wash px-4 py-3 text-sm text-ink-soft">
            <strong className="font-semibold text-ember">Demo itinerary.</strong> No model key was
            set, so this is the bundled Lisbon sample rather than a plan for “{input.destination}”.
            Add <code className="font-mono text-xs">GEMINI_API_KEY</code> (free) to{" "}
            <code className="font-mono text-xs">.env</code> and generate again.
          </p>
        )}

        <BudgetPanel
          budget={trip.budget}
          currency={input.currency}
          travelers={input.travelers}
          askedFor={input.budget}
        />

        <TripWorkspace payload={payload} />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Places worth your time</h2>
            <p className="text-sm text-muted">
              {located} of {totalVenues} venues verified on {placesProviderLabel()}
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {payload.places.map((place) => (
              <PlaceCard key={place.name} place={place} currency={input.currency} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">Where to eat</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {payload.restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.name}
                restaurant={restaurant}
                currency={input.currency}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">Know before you go</h2>
            <ul className="mt-4 space-y-3">
              {trip.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-mono text-xs font-semibold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">Worth packing</h2>
            <ul className="mt-4 grid gap-2.5">
              {trip.packingList.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
