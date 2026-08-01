import type { PlaceMatch } from "./types";

/**
 * OpenStreetMap place lookup — the no-API-key, no-credit-card alternative to
 * Google Places.
 *
 *   search + autocomplete : Photon (photon.komoot.io), an OSM geocoder
 *   photos                : Wikipedia / Wikimedia Commons
 *   directions link       : a Google Maps search URL, which needs no key
 *
 * What you get compared to Google Places: existence, coordinates, address,
 * and usually a photo for landmarks. What you do not get: star ratings, review
 * counts, price levels or opening hours — OSM simply does not hold that data.
 *
 * The verification value survives the swap: if Photon cannot find a venue the
 * model invented, it gets no pin, exactly as before.
 */

const PHOTON = "https://photon.komoot.io/api";
const WIKI = "https://en.wikipedia.org/w/api.php";
const UA = "wayfare-travel-planner/1.0 (portfolio project)";

/** Public geocoders ask for courtesy, not volume. Three at a time is polite. */
const CONCURRENCY = 3;

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

const cache = new Map<string, PlaceMatch | null>();

/* ── helpers ─────────────────────────────────────────────────── */

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents so "Sao Jorge" matches either spelling
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Articles and connectives — carry no identity. */
const ARTICLES = new Set([
  "the","a","an","de","da","do","du","dos","das","la","le","les","el","los","las","lo",
  "of","and","y","e","i","di","del","della","van","von","al","au","aux","in","on",
]);

/**
 * Words describing what kind of place it is. These are the words that differ
 * harmlessly between a query and a listing — "Castelo de São Jorge" vs
 * "São Jorge Castle", "Museo Frida Kahlo" vs "Frida Kahlo Museum".
 */
const CATEGORY_WORDS = new Set([
  // eating and drinking
  "cafe","coffee","restaurant","restaurante","ristorante","bar","pub","tavern","taberna",
  "bistro","brasserie","cervejaria","izakaya","ramen","sushi","pizzeria","trattoria",
  "osteria","cantina","grill","kitchen","lounge","rooftop","terrace","bakery","pastelaria",
  // staying
  "hotel","riad","hostel","inn","guesthouse","pousada",
  // seeing
  "museum","museo","museu","musee","gallery","galeria","palace","palacio","palazzo",
  "castle","castelo","castillo","fort","fortress","tower","torre","market","mercado",
  "marche","park","parque","jardin","jardim","garden","gardens","square","praca","plaza",
  "piazza","cathedral","catedral","church","igreja","iglesia","chiesa","temple","shrine",
  "mosque","mesquita","monastery","mosteiro","monasterio","bridge","ponte","beach","praia",
  "playa","viewpoint","miradouro","aquarium","oceanario","zoo","library","biblioteca",
  "theatre","theater","teatro","stadium","estadio","station","estacao","centre","center",
]);

const isDistinctive = (word: string) =>
  word.length > 2 && !ARTICLES.has(word) && !CATEGORY_WORDS.has(word);

/**
 * Guard against the geocoder confidently returning something unrelated.
 * Without this, a venue the model invented would still get a pin — which is
 * precisely the failure mode this whole layer exists to prevent.
 */
/** Edit distance, capped at 2 — enough to spot a transliteration wobble. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Transliterations disagree in ways that are obviously the same word:
 * "Jemaa el-Fnaa" vs OSM's "Jemaa el-Fna". One character of slack on words of
 * four letters or more catches those without merging genuinely different names.
 */
function wordPresent(word: string, words: Set<string>): boolean {
  if (words.has(word)) return true;
  if (word.length < 4) return false;
  for (const candidate of words) {
    // The candidate may be the shorter spelling ("fna" for "fnaa"), so the
    // length floor applies to the pair, not to each side.
    if (Math.max(word.length, candidate.length) >= 4 && editDistance(word, candidate) <= 1) {
      return true;
    }
  }
  return false;
}

export function namesMatch(query: string, result: string): boolean {
  const q = normalise(query);
  const r = normalise(result);
  if (!r) return false;
  if (q === r) return true;

  const distinctive = q.split(" ").filter(isDistinctive);
  const resultWords = new Set(r.split(" "));

  // Nothing distinctive to go on (e.g. "The Market") — demand a literal match.
  if (!distinctive.length) return r.includes(q);

  const missing = distinctive.filter((w) => !wordPresent(w, resultWords));
  if (missing.length === 0) return true;

  /**
   * Models append branch and district qualifiers that listings omit:
   * "Gyukatsu Motomura Shibuya", "Musée Yves Saint Laurent Marrakech".
   * Those qualifiers always come last, so one unmatched trailing word is
   * forgiven — but only when enough of the name has already matched.
   *
   * The three-word floor is what keeps this safe. "Sakura Hoshino Izakaya" has
   * just two distinctive words, so it still needs both, and the invented venue
   * does not get to borrow the real "Sakura Izakaya" pin.
   */
  const lastWord = distinctive[distinctive.length - 1];
  return distinctive.length >= 3 && missing.length === 1 && missing[0] === lastWord;
}

/**
 * Words that describe what a venue *is* rather than what it is called. Models
 * write "El Fenn Rooftop Bar & Restaurant"; OSM has "El Fenn". Trimming these
 * from the END only is safe — it never turns a specific name into a generic one
 * ("Museu Nacional do Azulejo" is left alone, because the generic word leads).
 */
const TRAILING_GENERIC = new Set([
  "bar", "restaurant", "cafe", "rooftop", "lounge", "grill", "bistro", "kitchen",
  "tavern", "pub", "hotel", "riad", "terrace", "and", "&",
]);

function stripTrailingGenerics(name: string) {
  const words = name.split(/\s+/);
  while (words.length > 1) {
    const last = normalise(words[words.length - 1]);
    if (!last || TRAILING_GENERIC.has(last)) words.pop();
    else break;
  }
  return words.join(" ");
}

/**
 * Streets are never venues, but they carry venue-like names and will happily
 * absorb a fuzzy match — "Taberna do Cravo Vermelho" matched a road called
 * "Avenida dos Cravos Vermelhos" before this filter existed.
 */
const NON_VENUE_KEYS = new Set(["highway", "railway", "waterway", "boundary", "landuse"]);

function toPlaceMatch(feature: PhotonFeature, city: string): PlaceMatch | null {
  const p = feature.properties ?? {};
  const coords = feature.geometry?.coordinates;
  if (!p.name || !coords) return null;
  if (p.osm_key && NON_VENUE_KEYS.has(p.osm_key)) return null;

  const address = [
    [p.housenumber, p.street].filter(Boolean).join(" "),
    p.postcode,
    p.city,
    p.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    placeId: `osm:${p.osm_type ?? "N"}${p.osm_id ?? ""}`,
    name: p.name,
    address: address || city,
    lat: coords[1],
    lng: coords[0],
    // OpenStreetMap holds no review data — the UI already handles nulls here.
    rating: null,
    reviewCount: null,
    priceLevel: null,
    photo: null, // filled in separately from Wikipedia
    // A Maps search URL works with no key and gives the user directions.
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${p.name}, ${p.city ?? city}`,
    )}`,
    website: null,
    openNow: null,
    types: [p.osm_key, p.osm_value].filter(Boolean) as string[],
  };
}

async function photonSearch(params: Record<string, string | number | undefined>) {
  const url = new URL(PHOTON);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.append(k, String(v));
  }

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);

  const json = (await res.json()) as { features?: PhotonFeature[] };
  return json.features ?? [];
}

/* ── venue lookup ────────────────────────────────────────────── */

/**
 * Look a venue up, trying a few phrasings before giving up.
 *
 * Two failure modes were costing real venues in testing:
 *
 *   lang=en returns OSM's English name, so "Museu Nacional do Azulejo" came
 *   back as "National Ceramic Tile Museum" and failed the similarity check.
 *   Dropping the language gives the local name instead. English still helps
 *   elsewhere — it is what makes Tokyo match at 100% — so both are tried.
 *
 *   Descriptive suffixes return nothing at all: "El Fenn Rooftop Bar &
 *   Restaurant" finds no result, "El Fenn" finds it immediately.
 *
 * The similarity guard applies to every attempt, so a venue the model invented
 * still matches nothing no matter which phrasing is used.
 */
export async function searchPlace(
  name: string,
  bias?: { lat: number; lng: number },
  cityHint = "",
): Promise<PlaceMatch | null> {
  const cleaned = name.split(",")[0].trim();
  if (!cleaned) return null;

  const key = `${cleaned}|${cityHint}|${bias ? `${bias.lat.toFixed(2)},${bias.lng.toFixed(2)}` : ""}`;
  if (cache.has(key)) return cache.get(key)!;

  const variants = [...new Set([cleaned, stripTrailingGenerics(cleaned)])];
  const languages: (string | undefined)[] = ["en", undefined];

  try {
    for (const variant of variants) {
      for (const lang of languages) {
        const features = await photonSearch({
          q: cityHint ? `${variant}, ${cityHint}` : variant,
          limit: 5,
          lang,
          lat: bias?.lat,
          lon: bias?.lng,
        });

        // Best-ranked feature whose name actually resembles what we asked for.
        for (const feature of features) {
          const match = toPlaceMatch(feature, cityHint);
          if (match && namesMatch(variant, match.name)) {
            cache.set(key, match);
            return match;
          }
        }
      }
    }

    cache.set(key, null);
    return null;
  } catch (err) {
    console.warn("[osm] search failed", name, err);
    return null;
  }
}

export async function resolveDestination(destination: string) {
  const cityName = destination.split(",")[0].trim();

  try {
    const features = await photonSearch({
      q: destination,
      limit: 5,
      lang: "en",
      layer: "city",
    });

    const feature =
      features.find((f) => namesMatch(cityName, f.properties?.name ?? "")) ?? features[0];
    if (!feature) return null;

    const match = toPlaceMatch(feature, cityName);
    if (!match) return null;

    const country = feature.properties?.country ?? "";
    const photo = await wikiPhoto(match.name, country);

    return { ...match, country, photo };
  } catch (err) {
    console.warn("[osm] destination lookup failed", destination, err);
    return null;
  }
}

export async function enrichNames(
  names: string[],
  context: { city: string; lat?: number | null; lng?: number | null },
): Promise<Map<string, PlaceMatch | null>> {
  const out = new Map<string, PlaceMatch | null>();
  const bias =
    typeof context.lat === "number" && typeof context.lng === "number"
      ? { lat: context.lat, lng: context.lng }
      : undefined;

  const unique = [...new Set(names.filter(Boolean))];

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const found = await Promise.all(
      batch.map((name) => searchPlace(name, bias, context.city)),
    );
    batch.forEach((name, idx) => out.set(name, found[idx]));
  }

  return out;
}

export async function autocompleteCities(input: string) {
  if (input.trim().length < 2) return [];

  try {
    const features = await photonSearch({ q: input, limit: 6, lang: "en", layer: "city" });

    return features
      .map((f) => {
        const p = f.properties ?? {};
        if (!p.name) return null;
        const secondary = [p.state, p.country].filter(Boolean).join(", ");
        return {
          placeId: `osm:${p.osm_type ?? "N"}${p.osm_id ?? ""}`,
          label: [p.name, secondary].filter(Boolean).join(", "),
          main: p.name,
          secondary,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  } catch (err) {
    console.warn("[osm] autocomplete failed", err);
    return [];
  }
}

/* ── photos from Wikipedia ───────────────────────────────────── */

const photoCache = new Map<string, string | null>();

/**
 * Wikipedia's search + pageimages gives a free, licensed photo for most
 * landmarks. Restaurants and small venues usually have no article, so this
 * returns null often — by design, rather than showing a wrong photo.
 */
export async function wikiPhoto(name: string, context = ""): Promise<string | null> {
  const key = `${name}|${context}`;
  if (photoCache.has(key)) return photoCache.get(key)!;

  const url = new URL(WIKI);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: [name, context].filter(Boolean).join(" "),
    gsrlimit: "1",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "900",
    origin: "*",
  }).toString();

  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 86_400 } });
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);

    const json = (await res.json()) as {
      query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> };
    };

    const page = Object.values(json.query?.pages ?? {})[0];
    // Wikipedia's search always returns *something*; only trust it if the
    // article title actually resembles the venue.
    const usable =
      page?.thumbnail?.source && namesMatch(name, page.title ?? "")
        ? page.thumbnail.source
        : null;

    photoCache.set(key, usable);
    return usable;
  } catch {
    photoCache.set(key, null);
    return null;
  }
}

/** Attach Wikipedia photos to whichever matches have none, a few at a time. */
export async function attachPhotos(
  matches: (PlaceMatch | null)[],
  context: string,
): Promise<void> {
  const pending = matches.filter((m): m is PlaceMatch => Boolean(m) && !m!.photo);

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const photos = await Promise.all(batch.map((m) => wikiPhoto(m.name, context)));
    batch.forEach((m, idx) => {
      m.photo = photos[idx];
    });
  }
}
