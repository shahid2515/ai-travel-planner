import type { PlaceMatch } from "./types";

/**
 * Thin wrapper over the Google **Places API (New)**.
 * Everything here degrades to `null` when GOOGLE_MAPS_API_KEY is missing,
 * so the app still renders (just without ratings, photos and map pins).
 */

const BASE = "https://places.googleapis.com/v1";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.photos",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.currentOpeningHours.openNow",
  "places.types",
].join(",");

export const hasGoogleKey = () => Boolean(process.env.GOOGLE_MAPS_API_KEY);

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: { name: string }[];
  googleMapsUri?: string;
  websiteUri?: string;
  currentOpeningHours?: { openNow?: boolean };
  types?: string[];
};

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function toPlaceMatch(p: RawPlace): PlaceMatch {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
    priceLevel: p.priceLevel ? (PRICE_LEVELS[p.priceLevel] ?? null) : null,
    photo: p.photos?.[0]?.name ?? null,
    mapsUrl: p.googleMapsUri ?? null,
    website: p.websiteUri ?? null,
    openNow: p.currentOpeningHours?.openNow ?? null,
    types: p.types ?? [],
  };
}

// Cheap in-process cache — one generation asks for ~20 places, many of which
// repeat across regenerations of the same city during a demo.
const cache = new Map<string, PlaceMatch | null>();

export async function searchPlace(
  query: string,
  bias?: { lat: number; lng: number; radiusMeters?: number },
): Promise<PlaceMatch | null> {
  if (!hasGoogleKey() || !query.trim()) return null;

  const key = `${query}|${bias ? `${bias.lat.toFixed(2)},${bias.lng.toFixed(2)}` : ""}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
        languageCode: "en",
        ...(bias
          ? {
              locationBias: {
                circle: {
                  center: { latitude: bias.lat, longitude: bias.lng },
                  radius: bias.radiusMeters ?? 30_000,
                },
              },
            }
          : {}),
      }),
      // Places results barely change; let Next cache them for a day.
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      console.warn("[places] searchText failed", res.status, await res.text());
      cache.set(key, null);
      return null;
    }

    const json = (await res.json()) as { places?: RawPlace[] };
    const match = json.places?.[0] ? toPlaceMatch(json.places[0]) : null;
    cache.set(key, match);
    return match;
  } catch (err) {
    console.warn("[places] searchText error", err);
    return null;
  }
}

/** Resolve the destination the user typed into a real city with coordinates. */
export async function resolveDestination(destination: string) {
  const match = await searchPlace(destination);
  if (!match) return null;
  const country = match.address.split(",").pop()?.trim() ?? "";
  return { ...match, country };
}

/** Look up many venue names at once, 6 at a time to stay well inside rate limits. */
export async function enrichNames(
  names: string[],
  context: { city: string; lat?: number | null; lng?: number | null },
): Promise<Map<string, PlaceMatch | null>> {
  const out = new Map<string, PlaceMatch | null>();
  if (!hasGoogleKey()) {
    names.forEach((n) => out.set(n, null));
    return out;
  }

  const bias =
    typeof context.lat === "number" && typeof context.lng === "number"
      ? { lat: context.lat, lng: context.lng }
      : undefined;

  const unique = [...new Set(names.filter(Boolean))];
  const BATCH = 6;

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((name) => searchPlace(`${name}, ${context.city}`, bias)),
    );
    batch.forEach((name, idx) => out.set(name, results[idx]));
  }

  return out;
}

/** City suggestions for the destination field. */
export async function autocompleteCities(input: string) {
  if (!hasGoogleKey() || input.trim().length < 2) return [];

  try {
    const res = await fetch(`${BASE}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ["(cities)"],
        languageCode: "en",
      }),
    });

    if (!res.ok) return [];

    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId: string;
          text?: { text?: string };
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        };
      }[];
    };

    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter(Boolean)
      .map((p) => ({
        placeId: p!.placeId,
        label: p!.text?.text ?? "",
        main: p!.structuredFormat?.mainText?.text ?? p!.text?.text ?? "",
        secondary: p!.structuredFormat?.secondaryText?.text ?? "",
      }))
      .filter((p) => p.label);
  } catch (err) {
    console.warn("[places] autocomplete error", err);
    return [];
  }
}

/** Turn a Places photo resource name into a public image URL. */
export async function resolvePhotoUrl(photoName: string, maxWidth = 900) {
  if (!hasGoogleKey()) return null;
  try {
    const url = `${BASE}/${photoName}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { photoUri?: string };
    return json.photoUri ?? null;
  } catch {
    return null;
  }
}
