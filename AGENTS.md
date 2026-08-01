# Working on this codebase

Notes for anyone — human or agent — changing this project.

## Run it

```bash
npm install
cp .env.example .env      # optional; runs without keys
npx prisma migrate deploy
npm run dev
```

`npm run doctor` checks whatever keys are configured against the live services
and names the exact fix for each failure.

## The one invariant that matters

**Never show a venue as verified unless a real place database found it.**

The app's whole value over a chat wrapper is step 3 of `src/lib/plan.ts`: every
venue the model names is re-queried against Google Places or OpenStreetMap, and
anything not found gets no map pin. Loosening the matching in
`src/lib/osm-places.ts` to catch more real venues has already let *invented*
ones through once.

`npm run test:lookup` guards this in both directions — real venues must be
found, plausible fakes must not. Run it after any change to matching.

## Verification

| Command | What it proves |
| --- | --- |
| `npm run doctor` | Keys work; names the fix when they don't |
| `npm run test:lookup` | The hallucination guard still holds |
| `npm run verify` | Four real generations, audited (needs `npm run dev` running) |
| `npm run typecheck` / `npm run lint` | The usual |

`npm run verify` costs real API calls. `npm run verify tokyo` runs one scenario.

## Things that will bite you

- **Model quota is per model.** `-latest` aliases track the newest model, which
  has the *smallest* free allowance. Models are pinned deliberately — see the
  comment in `src/lib/llm.ts`.
- **Generation must finish inside 60s** (Vercel Hobby). Trips of 6+ days switch
  to a faster model for exactly that reason. The `[plan]` log line prints the
  model/lookup split when something times out.
- **Two database URLs.** `DATABASE_URL` is pooled and used by the app;
  `DIRECT_URL` is unpooled and used by migrations. Swapping them exhausts
  Postgres connections in production.
- **Structured Outputs is strict.** Every schema object needs
  `additionalProperties: false` and every property listed in `required`. Gemini
  rejects `additionalProperties`, so `src/lib/llm.ts` strips it per provider.
- **`placeName` links an activity to a map pin** by exact name match. Changing
  schema field names without updating `trip-utils.ts` silently empties the map.

## Next.js version

This project is on Next.js 16: `params` and `searchParams` are Promises,
`cookies()` is async, and Turbopack is the default builder. Check
`node_modules/next/dist/docs/` before assuming an older API.
