import * as google from "./google-places";
import * as osm from "./osm-places";
import type { PlaceMatch } from "./types";

/**
 * Place-lookup facade.
 *
 * Google Places is used when a key is configured; otherwise the app falls back
 * to OpenStreetMap, which needs no key and no billing account. Both providers
 * return the same `PlaceMatch` shape, so nothing downstream knows the difference
 * beyond ratings being null on OSM.
 */

export type PlacesProviderName = "google" | "osm";

export const placesProvider = (): PlacesProviderName =>
  process.env.GOOGLE_MAPS_API_KEY ? "google" : "osm";

export const placesProviderLabel = () =>
  placesProvider() === "google" ? "Google Places" : "OpenStreetMap";

/** Only Google carries ratings and review counts; the UI hides them otherwise. */
export const providerHasRatings = () => placesProvider() === "google";

export async function resolveDestination(destination: string) {
  return placesProvider() === "google"
    ? google.resolveDestination(destination)
    : osm.resolveDestination(destination);
}

export async function enrichNames(
  names: string[],
  context: { city: string; lat?: number | null; lng?: number | null },
): Promise<Map<string, PlaceMatch | null>> {
  if (placesProvider() === "google") return google.enrichNames(names, context);

  const matches = await osm.enrichNames(names, context);
  // OSM has no photos of its own — borrow them from Wikipedia.
  await osm.attachPhotos([...matches.values()], context.city);
  return matches;
}

export async function autocompleteCities(input: string) {
  return placesProvider() === "google"
    ? google.autocompleteCities(input)
    : osm.autocompleteCities(input);
}

/** Google photo references need resolving server-side; OSM photos are plain URLs. */
export async function resolvePhotoUrl(reference: string, maxWidth = 900) {
  if (reference.startsWith("http")) return reference;
  return google.resolvePhotoUrl(reference, maxWidth);
}
