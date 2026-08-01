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
      <header className="relative border-b border-line bg-ink">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={destination.name}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        )}
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/70">
            {destination.name}
            {destination.country ? `, ${destination.country}` : ""}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            {trip.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">{trip.summary}</p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-white">
            {[
              ["When", dateLine],
              ["Who", `${input.travelers} ${input.travelers === 1 ? "traveller" : "travellers"}`],
              ["Pace", input.pace.charAt(0).toUpperCase() + input.pace.slice(1)],
              ["Plan", `${activities} stops across ${trip.days.length} days`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-white/60">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
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
