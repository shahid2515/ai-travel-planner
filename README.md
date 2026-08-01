# Wayfare — AI Travel Planner

Pick a destination and a budget. Get a costed, day-by-day itinerary with real places, real
restaurants and a live map — saved for later.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Structured Outputs on
Gemini **or** OpenAI · OpenStreetMap **or** Google Places · Prisma + SQLite

Both integration points are provider-agnostic: the app runs entirely on free tiers with no credit
card, and switches to OpenAI + Google Places by adding environment variables.

---

## Run it

```bash
npm install
cp .env.example .env      # optional — the app runs without keys
npx prisma migrate dev    # creates prisma/dev.db
npm run dev               # http://localhost:3000
```

**It works with no API keys at all** — a bundled Lisbon itinerary keeps the whole flow demoable.
**One free key makes it fully functional:** get a Gemini key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card), add it to `.env`
as `GEMINI_API_KEY`, and it generates real trips for any destination.

| Variable | Effect |
| --- | --- |
| `GEMINI_API_KEY` | Free tier, no card. Generation works. |
| `OPENAI_API_KEY` | Alternative provider; needs billing credit. Wins if both are set. |
| `LLM_PROVIDER` | `gemini` or `openai` — forces one when both keys exist |
| *(neither)* | Serves the bundled demo itinerary |
| `GOOGLE_MAPS_API_KEY` | Adds star ratings, reviews and Google photos. Without it, venue lookup uses OpenStreetMap. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Renders Google Maps. Without it, Leaflet + OSM tiles. |

### What the free stack costs you

OpenStreetMap knows a venue exists and where it is; it holds no star ratings, review counts, price
levels or opening hours. Photos come from Wikipedia rather than Places, which covers landmarks well
and small restaurants poorly. **The verification value is unchanged** — a venue the model invents
still fails the lookup and gets no map pin.

Getting keys and locking them down is covered step by step in [ROADMAP.md](./ROADMAP.md). Once
they're in `.env`, run **`npm run doctor`** — it calls each service and translates the provider's
error into the exact setting to change (billing not enabled, wrong Places API, referrer restriction
on the server key, and so on).

---

## How a trip gets built

```
POST /api/trips/generate
  │
  ├─ 1. Place lookup  →  resolve "Lisbon" to coordinates + a hero photo    ┐ in parallel
  ├─ 2. The model     →  structured JSON: places, restaurants, day plans   ┘
  │
  ├─ 3. Place lookup  →  every venue name, a few at a time
  │                      address · lat/lng · photo · directions link
  │                      (+ ratings and reviews when Google Places is configured)
  │
  ├─ 4. Anything the lookup cannot find is kept but rendered without a pin,
  │     so hallucinated venues never end up on the map
  │
  └─ 5. Save to SQLite, redirect to /trips/{id}
```

Step 3 is the point of the whole app. A model asked for restaurants will occasionally invent one;
re-querying every name against a real place database is what separates this from a chat wrapper.
The OpenStreetMap adapter guards further with a name-similarity check, so a geocoder confidently
returning something unrelated does not count as a match.

The model is pinned to a strict JSON Schema (`src/lib/openai-schema.ts`), so the response is
always the exact shape the UI expects — no parsing, no retries, no "sometimes it returns prose".

## Layout

```
src/
  app/
    page.tsx                    landing + planner form
    trips/page.tsx              saved trips
    trips/[id]/page.tsx         the itinerary
    api/trips/generate/route.ts the pipeline entry point
    api/trips/[id]/route.ts     GET / DELETE one trip
    api/places/autocomplete     destination suggestions
    api/photo                   proxies Places photos (keeps the key server-side)
  components/
    PlannerForm.tsx             the form + generating overlay
    DestinationField.tsx        debounced city autocomplete
    trip/TripWorkspace.tsx      day switcher + timeline + map (client)
    trip/TripMap.tsx            picks a map implementation, lazily
    trip/GoogleTripMap.tsx      Google Maps + Advanced Markers
    trip/LeafletTripMap.tsx     Leaflet + OSM tiles, no key required
    trip/BudgetPanel.tsx        stacked-bar budget breakdown
    trip/PlaceCard.tsx          place + restaurant cards
  lib/
    plan.ts                     the orchestration described above
    llm.ts                      provider selection (Gemini / OpenAI) + generation
    openai-schema.ts            the strict JSON Schema the model must fill
    places.ts                   facade: picks Google or OpenStreetMap
    google-places.ts            Places API (New) wrapper
    osm-places.ts               Photon + Wikipedia wrapper, no key required
    trips.ts / db.ts            persistence
    demo.ts                     the no-key fallback itinerary
    types.ts / trip-utils.ts    shared types and pure helpers
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` then a production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run doctor` | Checks each API key against its live service and names the exact fix |
| `npm run verify` | Generates 4 real trips against the running app and audits them (below) |
| `npm run test:lookup` | Checks that real venues are found and invented ones are not |
| `npm run db:studio` | Browse the SQLite database |

## Verifying the output

A JSON Schema guarantees the *shape* of a response, not that it is a good
itinerary. `scripts/verify.mjs` generates four trips — different cities, lengths, group sizes,
currencies and paces — and audits each one:

- day count matches the request; activity times run forwards; every day has 4+ activities and a meal
- the budget breakdown adds up to the total, the per-person figure is consistent, and the total
  stays near what the user asked for
- **every venue is checked against the place database** — the match rate fails below 50%
- every activity's `placeName` resolves to a venue that is actually in the trip's lists
- no duplicate venues, no filler phrasing ("immerse yourself", "hidden gem")

```bash
npm run dev                # one terminal
npm run verify             # another — or `npm run verify tokyo` for a single scenario
```

Non-zero exit on any failure, so it can gate a deploy. Without an OpenAI key it runs against demo
mode and reports the Google-dependent checks as informational.

## Notes

- Trips belong to an anonymous `tp_owner` cookie, not a login. Swapping in real auth is a
  one-function change (`src/lib/session.ts`).
- Places photos are proxied through `/api/photo` so the server key never reaches the browser.
- Generation takes 25–45s; the route sets `maxDuration = 60` for Vercel's Hobby ceiling. Trips of
  6+ days switch to a faster model to stay inside it.
- `/api/trips/generate` is rate limited (5 per visitor per hour, 40 per day globally) so a public
  demo cannot drain the free API quota. Tune with `RATE_LIMIT_*` in `.env`.
