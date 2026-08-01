import type { GeneratedTrip, TripInput } from "./types";

/**
 * Guard rails for the handful of things a JSON Schema cannot enforce.
 *
 * Kept apart from `llm.ts` so it can be tested without pulling in an API
 * client — and because it is the one piece of that file with no I/O in it.
 *
 * A schema can say "days is an array of day objects". It cannot say "there are
 * exactly five of them, numbered 1 to 5, with activities in chronological
 * order and a budget that adds up".
 */
export function normaliseTrip(trip: GeneratedTrip, input: TripInput): GeneratedTrip {
  const days = [...(trip.days ?? [])]
    .sort((a, b) => a.day - b.day)
    // Models occasionally return more days than asked for; never fewer that we
    // can fix, but the extras would render as phantom tabs.
    .slice(0, input.days)
    .map((day, i) => ({
      ...day,
      day: i + 1,
      activities: [...(day.activities ?? [])].sort((a, b) =>
        String(a.time).localeCompare(String(b.time)),
      ),
    }));

  const breakdown = (trip.budget?.breakdown ?? []).filter((b) => b.amount > 0);
  const total = trip.budget?.total || breakdown.reduce((sum, b) => sum + b.amount, 0);

  return {
    ...trip,
    days,
    places: trip.places ?? [],
    restaurants: trip.restaurants ?? [],
    tips: trip.tips ?? [],
    packingList: trip.packingList ?? [],
    budget: {
      ...trip.budget,
      total,
      // Recomputed rather than trusted: models routinely divide wrongly.
      perPerson: Math.round(total / Math.max(1, input.travelers)),
      breakdown,
    },
  };
}
