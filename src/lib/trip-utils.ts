import type { EnrichedPlace, EnrichedRestaurant, TripPayload } from "./types";

/** Pure helpers shared by server and client components — no API clients in here. */

export type AnyEnriched = EnrichedPlace | EnrichedRestaurant;

export function findByName(payload: TripPayload, name: string): AnyEnriched | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  return (
    payload.places.find((p) => p.name.trim().toLowerCase() === needle) ??
    payload.restaurants.find((r) => r.name.trim().toLowerCase() === needle) ??
    null
  );
}

export interface MapStop {
  key: string;
  label: string; // "1", "2", … within the selected day
  name: string;
  lat: number;
  lng: number;
  kind: "place" | "restaurant";
  time: string;
  /** Index of the activity this pin came from, so the timeline can show the
   *  same number. Without it the map says "3" and the itinerary says "2pm",
   *  and nothing tells the reader they are the same stop. -1 when not from a
   *  specific activity (the whole-trip view). */
  activityIndex: number;
}

/** Map pins for one day, in visiting order, skipping anything Google could not place. */
export function stopsForDay(payload: TripPayload, dayIndex: number): MapStop[] {
  const day = payload.trip.days[dayIndex];
  if (!day) return [];

  const stops: MapStop[] = [];
  day.activities.forEach((activity, i) => {
    const match = findByName(payload, activity.placeName);
    const g = match?.google;
    if (!g || (!g.lat && !g.lng)) return;
    stops.push({
      key: `${dayIndex}-${i}-${g.placeId}`,
      label: String(stops.length + 1),
      name: match!.name,
      lat: g.lat,
      lng: g.lng,
      // Membership, not duck-typing on a "cuisine" field: a restaurant with a
      // missing field would silently render with the wrong pin colour.
      kind: payload.restaurants.includes(match as never) ? "restaurant" : "place",
      time: activity.time,
      activityIndex: i,
    });
  });

  return stops;
}

/** Every located venue in the trip, for the "everything" map view. */
export function allStops(payload: TripPayload): MapStop[] {
  const build = (items: AnyEnriched[], kind: MapStop["kind"]): MapStop[] =>
    items
      .filter((i) => i.google?.lat || i.google?.lng)
      .map((i, idx) => ({
        key: `${kind}-${i.google!.placeId || idx}`,
        label: "",
        name: i.name,
        lat: i.google!.lat,
        lng: i.google!.lng,
        kind,
        time: "",
        activityIndex: -1,
      }));

  return [...build(payload.places, "place"), ...build(payload.restaurants, "restaurant")];
}

export function mapCenter(payload: TripPayload, stops: MapStop[]) {
  if (payload.destination.lat && payload.destination.lng) {
    return { lat: payload.destination.lat, lng: payload.destination.lng };
  }
  if (stops.length) {
    return {
      lat: stops.reduce((s, p) => s + p.lat, 0) / stops.length,
      lng: stops.reduce((s, p) => s + p.lng, 0) / stops.length,
    };
  }
  return null;
}

export function tripTotals(payload: TripPayload) {
  const located = [...payload.places, ...payload.restaurants].filter((i) => i.google).length;
  const totalVenues = payload.places.length + payload.restaurants.length;
  const activities = payload.trip.days.reduce((sum, d) => sum + d.activities.length, 0);
  return { located, totalVenues, activities };
}
