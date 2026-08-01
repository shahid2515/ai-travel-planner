import { demoTrip } from "./demo";
import { generateTrip, hasModelProvider } from "./llm";
import { enrichNames, resolveDestination } from "./places";
import type { EnrichedPlace, EnrichedRestaurant, TripInput, TripPayload } from "./types";
import { buildDates } from "./utils";

/**
 * The whole generation pipeline in one place:
 *   1. resolve the destination (coordinates + hero photo)
 *   2. ask the model for the itinerary  — steps 1 and 2 run in parallel
 *   3. look every venue the model named up in a real place database
 *   4. anything the lookup cannot find gets no pin, so invented venues never
 *      appear on the map as if they were real
 */
export async function planTrip(input: TripInput): Promise<TripPayload> {
  const dates = buildDates(input.startDate || null, input.days);
  const demo = !hasModelProvider();

  const startedAt = Date.now();

  const [destination, trip] = await Promise.all([
    resolveDestination(input.destination),
    demo ? Promise.resolve(demoTrip(input)) : generateTrip(input, dates),
  ]);

  const generatedAtMs = Date.now();
  const city = trip.city || destination?.name || input.destination;

  const names = [...trip.places.map((p) => p.name), ...trip.restaurants.map((r) => r.name)];
  const matches = await enrichNames(names, {
    city,
    lat: destination?.lat,
    lng: destination?.lng,
  });

  // Serverless platforms cap request duration (60s on Vercel Hobby), so keep
  // the split visible — it is the first thing to look at when one times out.
  console.log(
    `[plan] ${city}: model ${((generatedAtMs - startedAt) / 1000).toFixed(1)}s, ` +
      `lookup ${((Date.now() - generatedAtMs) / 1000).toFixed(1)}s, ` +
      `${names.length} venues`,
  );

  const places: EnrichedPlace[] = trip.places.map((p) => ({
    ...p,
    google: matches.get(p.name) ?? null,
  }));
  const restaurants: EnrichedRestaurant[] = trip.restaurants.map((r) => ({
    ...r,
    google: matches.get(r.name) ?? null,
  }));

  const heroPhoto =
    destination?.photo ??
    places.find((p) => p.google?.photo)?.google?.photo ??
    restaurants.find((r) => r.google?.photo)?.google?.photo ??
    null;

  return {
    input,
    trip,
    places,
    restaurants,
    destination: {
      name: city,
      country: trip.country || destination?.country || "",
      lat: destination?.lat ?? null,
      lng: destination?.lng ?? null,
      photo: heroPhoto,
      placeId: destination?.placeId ?? null,
    },
    dates,
    demo,
    generatedAt: new Date().toISOString(),
  };
}
