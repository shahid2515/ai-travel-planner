# AI Travel Planner — full build roadmap

Everything needed to take this from the working app in this folder to a deployed portfolio piece
you can put a live link to on Upwork. Phases 0–3 are **already built**; the rest is the plan.

---

## Phase 0 — Decisions (done, and why)

| Decision | Choice | Why |
| --- | --- | --- |
| Model provider | **Gemini or OpenAI**, one interface | Google publishes an OpenAI-compatible endpoint, so one SDK drives both. Gemini's free tier needs no credit card |
| Place lookup | **OpenStreetMap or Google Places**, one interface | Same reason — the app is fully functional on free tiers, and upgrades with an env var |
| Framework | Next.js 16, App Router | Server components keep API keys server-side with no separate backend |
| Language | TypeScript, strict | The whole app hangs off one generated JSON shape — types are the safety net |
| Styling | Tailwind v4 + a small CSS layer (`.card`, `.field`, `.btn`, `.chip`) | Fast, and avoids a 40-file component library in a portfolio piece |
| LLM call | Chat Completions + **Structured Outputs** (`json_schema`, `strict: true`) | Guarantees the response shape. No JSON repair, no retry loop |
| Maps | **Places API (New)** server-side, Maps JavaScript API in the browser | One API covers search, autocomplete and photos; two keys with different restrictions |
| Database | Prisma + SQLite locally, Postgres in production | `npx prisma migrate dev` and you have a database; changing provider is a two-line diff |
| Auth | Anonymous cookie (`tp_owner`) | Save-for-later works with zero friction. Real auth is one function away |
| No-key mode | Bundled Lisbon itinerary | The demo never breaks in front of a client, and reviewers can run it instantly |

**Why the double lookup matters.** An LLM asked for restaurants will occasionally invent one. Every
venue name is therefore re-queried against Google Places; anything Google can't find is rendered
without a rating or map pin. That's the difference between "an AI wrapper" and something a client
would actually ship — and it is the single best thing to point at in an interview.

---

## Phase 1 — Accounts and keys

### Option A: free tier, no credit card (5 minutes) ← what this project uses

| Piece | Service | Card? |
| --- | --- | --- |
| Generation | **Google AI Studio (Gemini)** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | No |
| Venue lookup | **OpenStreetMap** via Photon — no signup at all | No |
| Photos | **Wikipedia / Wikimedia** — no signup | No |
| Map | **Leaflet + CARTO/OSM tiles** — no signup | No |

One key, pasted into `.env` as `GEMINI_API_KEY`, and everything works. Run `npm run doctor` to
confirm. Gemini's free tier allows far more requests per day than a portfolio demo will ever use.

The trade-off is star ratings and review counts, which OpenStreetMap does not hold, and weaker
photo coverage for small restaurants. Everything else — real generation, venue verification, map
pins, addresses, directions links — is identical.

### Option B: paid stack (30–45 min, needs a card)

### OpenAI

1. platform.openai.com → **API keys** → create a secret key → paste into `.env` as `OPENAI_API_KEY`.
2. **Billing → add $5–10.** New accounts without credit return 429 on every call.
3. Set a **monthly usage limit** ($5 is plenty) so a runaway loop can't cost you.
4. Model: `gpt-4o-mini` is the default and costs roughly **$0.002–0.004 per itinerary**.
   `gpt-4.1` produces noticeably better day plans at ~10× that — still under 4¢ a trip. Switch with
   `OPENAI_MODEL` in `.env`; any model supporting Structured Outputs works.

### Google Cloud

1. console.cloud.google.com → **new project** ("wayfare").
2. **Billing must be enabled** — the Maps APIs return `REQUEST_DENIED` without it. There is a
   recurring free tier; a portfolio demo will not exceed it.
3. **APIs & Services → Enable APIs**, enable exactly these:
   - **Places API (New)** — text search, autocomplete, photos (server side)
   - **Maps JavaScript API** — the map component (browser side)
4. Create **two** keys under Credentials:
   - **Server key** → `GOOGLE_MAPS_API_KEY`. Restrict to *Places API (New)*. Add an IP restriction
     once you know your deploy IP; leave unrestricted while developing locally.
   - **Browser key** → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Restrict to *Maps JavaScript API* and to
     HTTP referrers: `http://localhost:3000/*` and `https://your-domain.vercel.app/*`.
     **This key ships in the HTML — the referrer restriction is what protects it.**
5. Optional: **Map Management → create a Map ID** (vector, with a custom style) →
   `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`. Without one the app uses Google's `DEMO_MAP_ID`, which works
   but shows a watermark.
6. **Set a billing budget alert at $5.** Do this before you write another line.

### Costs at portfolio scale

| Item | Per trip | 200 demo trips |
| --- | --- | --- |
| OpenAI (`gpt-4o-mini`) | ~$0.003 | ~$0.60 |
| Places text search (~20 lookups) | ~$0.06 | covered by free tier |
| Places photos + map loads | ~$0.02 | covered by free tier |

The in-process cache in `google-places.ts` and Next's 24-hour `revalidate` mean re-generating the
same city costs almost nothing.

---

## Phase 2 — The build (done — this is what's in the repo)

Build order, and roughly how long each part takes if you were doing it from scratch:

| # | Step | Files | Time |
| --- | --- | --- | --- |
| 1 | Scaffold, Tailwind theme, layout shell | `globals.css`, `layout.tsx` | 1h |
| 2 | Types + the strict JSON Schema | `lib/types.ts`, `lib/openai-schema.ts` | 1.5h |
| 3 | OpenAI call + prompt + normalisation | `lib/openai.ts` | 2h |
| 4 | Places wrapper (search, autocomplete, photos) | `lib/google-places.ts` | 2h |
| 5 | Orchestration pipeline | `lib/plan.ts` | 1h |
| 6 | Prisma model + repository | `prisma/schema.prisma`, `lib/trips.ts` | 1h |
| 7 | API routes | `app/api/**` | 1h |
| 8 | Planner form + autocomplete + progress overlay | `components/PlannerForm.tsx` etc. | 3h |
| 9 | Trip page: hero, budget, timeline, map, cards | `components/trip/**` | 4h |
| 10 | Saved trips, delete, empty states, 404 | `app/trips/**` | 1.5h |
| 11 | Demo fallback so it runs with no keys | `lib/demo.ts` | 1.5h |

**Roughly 20 focused hours.** Quote it as a 3–5 day build.

### Data model

```prisma
model Trip {
  id        String   @id @default(cuid())
  ownerId   String            // anonymous cookie id
  title     String
  summary   String
  city      String            // denormalised so the list page never parses JSON
  country   String
  lat       Float?
  lng       Float?
  startDate String?
  days      Int
  travelers Int
  budget    Int
  currency  String
  pace      String
  heroPhoto String?
  data      String            // the full generated + enriched payload as JSON
  createdAt DateTime @default(now())
  @@index([ownerId, createdAt])
}
```

A JSON blob plus denormalised columns is deliberate: the payload shape will keep changing while you
iterate on the prompt, and the list page still needs to sort and filter without deserialising.

### Prompt notes that actually mattered

- **Strict mode has rules.** Every object needs `additionalProperties: false`, every property must
  be in `required`, and `minimum`/`maximum`/`format` are rejected. No optional fields — use `""`
  and `0` instead. That's why `placeName` is an empty string rather than absent.
- **`placeName` repeated verbatim** is what links an activity to a map pin. The prompt says so
  explicitly, twice.
- **"If you are not certain a place exists, leave it out"** measurably cuts invented venues.
- **Geographic grouping** in the system prompt is what stops day 2 bouncing across the city.
- `temperature: 0.7` — lower gets repetitive across regenerations, higher starts inventing.

---

## Phase 3 — Verify locally (done)

```bash
npm run typecheck && npm run lint && npm run build
npm run dev
```

Checklist that was run, and worth re-running after any change:

- [x] Generate with no keys → demo trip saved, page renders, map shows its placeholder
- [x] Trip appears on `/trips`, opens, deletes, then 404s
- [x] Production build passes with zero type or lint errors
- [x] Driven end to end in headless Chromium — form, generation, day switching, saved trips,
      mobile viewport, zero console errors
- [x] `npm run verify` — 4 scenarios, 56 checks, all green in demo mode
- [x] `npm run verify` **live on Gemini** — 4 cities, 68 checks, 0 failures
- [x] `npm run test:lookup` — 9 real venues found, 6 invented ones rejected
- [x] Map pins follow the selected day, Leaflet + OSM tiles

### What the live run found

Every one of these was invisible until the real APIs ran. This is the argument
for step 17 existing at all.

| Finding | Fix |
| --- | --- |
| `gemini-2.5-flash` is retired for new accounts | Switched models; `doctor` now probes and names working alternatives |
| Venue match rate only ~65% — OSM returns English names (`Museu Nacional do Azulejo` → `National Ceramic Tile Museum`) | Retry the lookup in the local language too |
| Descriptive suffixes find nothing (`El Fenn Rooftop Bar & Restaurant`) | Strip trailing category words before searching |
| Loosening the match let 3 of 6 **invented** venues through | Require every *distinctive* word, not a 50% overlap |
| Tightening it lost real venues with branch suffixes (`Gyukatsu Motomura Shibuya`) | Forgive one unmatched *trailing* word, only when 3+ distinctive words already matched |
| `Jemaa el-Fnaa` vs OSM's `Jemaa el-Fna` | One character of edit-distance slack |
| Fuzzy matching then matched a *street*, `Avenida dos Cravos Vermelhos` | Reject `highway`/`railway` OSM categories outright |
| A 7-day trip took **62s** — over Vercel's 60s limit | Measured the split (model 61.7s, lookup 4.7s); long trips now use the faster model |
| Free-tier quota exhausted mid-testing | Quota is **per model**; `-latest` aliases track the newest model, which has the *smallest* allowance (20 requests). Pinned a stable version instead |
| A 429 was retried as if the schema was rejected, doubling the quota hit | Only a 400 triggers the schema fallback now |
| Rate limits surfaced as "could not build that itinerary" | Status-code-based error handling with an honest message |

### Live results

| Scenario | Time | Venues verified |
| --- | --- | --- |
| Lisbon · 3 days · couple | 40.9s | 17/17 (100%) |
| Tokyo · 7 days · solo | 29.5s | 12/17 (71%) |
| Mexico City · 5 days · family | 43.0s | 14/15 (93%) |
| Marrakech · 2 days · couple | 42.4s | 14/15 (93%) |

**Tokyo is the weak spot and probably stays that way.** OpenStreetMap's Japanese
coverage names branches inconsistently, so single-branch restaurants like
"Afuri Harajuku" often have no matching entry. Google Places would find them —
this is the clearest case for adding the paid key later.

### The verification harness

`scripts/verify.mjs` exists because Structured Outputs guarantees the *shape* of the response and
nothing else. A perfectly valid response can still have six days when five were asked for, times
running backwards, a breakdown that doesn't sum to its own total, or a restaurant that does not
exist. The harness generates four trips (different cities, lengths, group sizes, currencies, paces)
and asserts all of that, plus the Google Places match rate and whether every activity's `placeName`
resolves to a venue in the trip's own lists. Non-zero exit on failure, so it can gate a deploy.

This is also worth showing a client. "I wrote a harness that audits the model's output" is a
different conversation from "I called the OpenAI API".

---

## Phase 4 — Deploy (1 hour)

SQLite does not survive on serverless — the filesystem is read-only and ephemeral. Move to Postgres:

1. **Database.** Neon or Supabase free tier → copy the pooled connection string.
2. **Schema.** In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   Delete `prisma/migrations/`, then `npx prisma migrate dev --name init` against the new URL.
3. **Push to GitHub**, import the repo on Vercel.
4. **Environment variables** in Vercel: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`,
   `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
5. **Add the Vercel domain** to the browser key's HTTP-referrer restrictions.
6. `build` already runs `prisma generate`. For schema changes on deploy, use
   `prisma migrate deploy && next build`.
7. Verify on the live URL: generate, save, delete, and check the network tab shows **no server key**.

**Guard the demo before you share it.** A public generate endpoint spends your OpenAI credit. Add a
per-cookie rate limit (e.g. 5 trips/hour) in `app/api/trips/generate/route.ts` — `countTrips()` is
already exported for exactly this — or put the whole app behind Vercel password protection and
share the password in your proposal.

---

## Phase 5 — Features that make it look senior (pick 2–3)

Ordered by impressiveness-per-hour:

| Feature | Hours | Why it lands |
| --- | --- | --- |
| **Stream the itinerary** as it generates (SSE / `ReadableStream`) instead of a 30s overlay | 4 | Perceived-performance work is the single most senior-looking thing here |
| **Regenerate one day** — "make day 3 cheaper / more relaxed" without rebuilding the trip | 3 | Shows partial-update thinking, not just one-shot prompting |
| **Drag to reorder** activities, persisted | 4 | Turns a read-only output into a tool |
| **Export to PDF** properly (`@react-pdf/renderer` or a print stylesheet) | 3 | The thing every real user asks for. `window.print()` is wired already |
| **Public share link** (`/share/[token]`, read-only) | 2 | Trivial, and demos beautifully |
| **Real auth** (Auth.js, Google provider) + migrate cookie-owned trips on first login | 4 | Answers "how would you add users?" before it's asked |
| **Weather** for the dates (Open-Meteo, free, no key) | 2 | Makes the plan feel researched |
| **Walking/transit time between stops** (Routes API) instead of the model's guess | 3 | Visibly more accurate; pairs with the "verify the LLM" story |
| **Hotel suggestions** by area within budget (Places, `lodging` type) | 3 | Closes the last obvious gap in the plan |
| **Cost per traveller sliders** that re-cost without a new LLM call | 2 | Pure client work, feels instant |

Things worth **not** building for a portfolio piece: flight search (paid APIs, licensing), real
booking, and multi-city trips (the day-grouping logic gets much harder for little visual payoff).

---

## Phase 6 — Hardening (if a client asks for it)

- **Rate limiting** — `@upstash/ratelimit` by IP + cookie.
- **Retry with backoff** on OpenAI 429/500; the SDK does two retries by default, make it explicit.
- **Zod-parse the model output**, not just the JSON Schema — belt and braces if you change models.
- **Structured logging** of prompt/response/latency/token counts per generation.
- **Tests** — Vitest over `normaliseTrip`, `buildDates`, `stopsForDay`, and the schema; Playwright
  for generate → save → delete with the API mocked.
- **Accessibility** — the day switcher should be a real tablist; run axe on the trip page.
- **Error boundary** (`app/error.tsx`) with a retry button.
- **`opengraph-image.tsx`** so shared trip links preview properly.

---

## Phase 7 — Package it for Upwork (2–3 hours, do not skip)

The build is half the deliverable. The presentation is the half that gets replies.

1. **Seed 3 good trips** on the live deployment — Lisbon 4 days, Tokyo 7 days, a $600 backpacker
   trip — so the first thing a visitor sees is populated, not an empty state.
2. **Screenshots** (portfolio thumbnails): the trip hero with a real photo, the day timeline beside
   the map, the budget breakdown, the saved-trips grid.
3. **A 60–90 second screen recording**: type a destination → the progress overlay → the finished
   trip → switch days and watch the pins move → save → reopen. No voiceover needed; captions are
   enough.
4. **Case-study copy** for the portfolio item — lead with the engineering, not the AI:

   > *AI Travel Planner — Next.js, OpenAI, Google Maps*
   > Generates a costed day-by-day itinerary from a destination and a budget. The model returns a
   > strict JSON schema, then every venue it names is re-verified against Google Places for
   > ratings, photos and coordinates — so invented restaurants never reach the map. Day plans are
   > grouped geographically, costed by category against the user's budget, and rendered on a live
   > map that follows the selected day. Trips persist to Postgres. Runs with no API keys via a
   > bundled demo mode.

5. **Pin the repo** on GitHub with the README above, and put the live URL in the repo description.
6. **In proposals**, link the live app first and the repo second. The thirty-second generate is the
   demo; let it play.

---

## Known gotchas

| Symptom | Cause / fix |
| --- | --- |
| `REQUEST_DENIED` from Places | Billing not enabled, or you enabled *Places API* instead of *Places API (New)* |
| Map renders grey | Browser key missing the Maps JavaScript API, or the referrer restriction doesn't match your URL |
| Advanced markers warning in console | No Map ID — set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, or ignore (it falls back to `DEMO_MAP_ID`) |
| Generation times out on Vercel | Hobby caps at 60s. Shorten the trip, use a faster model, or stream |
| Model returns fewer days than requested | Restated in the user prompt *and* clamped in `normaliseTrip` — check both if it recurs |
| Photos 404 | Places photo URLs are signed and expire; the app resolves them per request through `/api/photo` rather than storing them |
| Prisma errors after editing the schema | `npx prisma migrate dev` then restart the dev server |
