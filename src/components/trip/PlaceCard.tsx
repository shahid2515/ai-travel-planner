import type { EnrichedPlace, EnrichedRestaurant } from "@/lib/types";
import { formatDuration, formatMoney, photoSrc } from "@/lib/utils";

function Stars({ rating, count }: { rating: number; count: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <span aria-hidden className="text-[#e0a53a]">
        ★
      </span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      {count ? <span className="text-muted">({count.toLocaleString("en-US")})</span> : null}
    </span>
  );
}

export function PlaceCard({ place, currency }: { place: EnrichedPlace; currency: string }) {
  const photo = photoSrc(place.google?.photo, 600);

  return (
    <article className="card overflow-hidden transition hover:shadow-md">
      {photo ? (
        // Places photos are proxied through /api/photo, so next/image would need
        // both localPatterns and remotePatterns config for no real gain here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={place.name}
          loading="lazy"
          className="h-40 w-full bg-sunk object-cover"
        />
      ) : (
        // Keep the same height with no photo, or the grid goes ragged.
        <div className="grid h-40 w-full place-items-center bg-gradient-to-br from-brand-wash to-sunk">
          <span className="font-mono text-xs uppercase tracking-widest text-brand/60">
            {place.category}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-wash px-2.5 py-1 font-semibold text-brand">
            {place.category}
          </span>
          <span className="text-muted">{place.neighborhood}</span>
          {place.google?.rating ? (
            <Stars rating={place.google.rating} count={place.google.reviewCount} />
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{place.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{place.description}</p>
        <p className="mt-3 border-l-2 border-brand pl-3 text-sm italic text-ink-soft">
          {place.whyVisit}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <div>
            <dt className="inline font-semibold text-ink-soft">
              {place.estimatedCost > 0 ? formatMoney(place.estimatedCost, currency) : "Free"}
            </dt>{" "}
            <dd className="inline">entry</dd>
          </div>
          {place.durationMinutes > 0 && (
            <div>
              <dt className="inline font-semibold text-ink-soft">
                {formatDuration(place.durationMinutes)}
              </dt>{" "}
              <dd className="inline">visit</dd>
            </div>
          )}
          <div className="basis-full">{place.bestTime}</div>
        </dl>

        {place.google?.mapsUrl && (
          <a
            href={place.google.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </div>
    </article>
  );
}

export function RestaurantCard({
  restaurant,
  currency,
}: {
  restaurant: EnrichedRestaurant;
  currency: string;
}) {
  const photo = photoSrc(restaurant.google?.photo, 600);
  const price = "$".repeat(Math.max(1, Math.min(4, restaurant.priceLevel || 2)));

  return (
    <article className="card overflow-hidden transition hover:shadow-md">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={restaurant.name}
          loading="lazy"
          className="h-40 w-full bg-sunk object-cover"
        />
      ) : (
        <div className="grid h-40 w-full place-items-center bg-gradient-to-br from-ember-wash to-sunk">
          <span className="font-mono text-xs uppercase tracking-widest text-ember/60">
            {restaurant.cuisine}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-ember-wash px-2.5 py-1 font-semibold text-ember">
            {restaurant.cuisine}
          </span>
          <span className="font-mono text-muted">{price}</span>
          {restaurant.google?.rating ? (
            <Stars rating={restaurant.google.rating} count={restaurant.google.reviewCount} />
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">
          {restaurant.name}
        </h3>
        <p className="mt-1 text-xs text-muted">{restaurant.neighborhood}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{restaurant.description}</p>

        <p className="mt-3 rounded-lg bg-sunk px-3 py-2 text-sm">
          <span className="font-semibold">Order:</span> {restaurant.mustTry}
        </p>

        <p className="mt-3 text-xs text-muted">
          About{" "}
          <span className="font-semibold text-ink-soft">
            {formatMoney(restaurant.averageMealCost, currency)}
          </span>{" "}
          per person
        </p>

        {restaurant.google?.mapsUrl && (
          <a
            href={restaurant.google.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </div>
    </article>
  );
}
