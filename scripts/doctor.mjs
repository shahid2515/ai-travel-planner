/**
 * Key diagnostic.
 *
 *   npm run doctor
 *
 * Checks whatever is configured against the live services and translates each
 * provider's error into the specific thing to go and click.
 *
 * Nothing here is required to run the app: with no keys it serves the bundled
 * demo itinerary, and place lookup falls back to OpenStreetMap, which needs no
 * key at all.
 */

import { readFileSync } from "node:fs";

/* ── read .env without a dependency ──────────────────────────── */

let env = {};
try {
  env = Object.fromEntries(
    readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
} catch {
  console.error("No .env file found. Copy .env.example to .env first.");
  process.exit(1);
}

// Real environment variables win, so this also works in CI or with a one-off
// override:  GEMINI_API_KEY=AIza... npm run doctor
for (const k of [
  "LLM_PROVIDER",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
]) {
  if (process.env[k]) env[k] = process.env[k];
}

const OK = "✓";
const NO = "✗";
const HM = "!";

let failures = 0;

const report = (icon, title, lines = []) => {
  if (icon === NO) failures++;
  console.log(`\n${icon} ${title}`);
  for (const line of lines.filter(Boolean)) console.log(`    ${line}`);
};

/* ── which model provider is active ──────────────────────────── */

function activeProvider() {
  const forced = env.LLM_PROVIDER?.toLowerCase();

  const openai = env.OPENAI_API_KEY
    ? {
        name: "openai",
        label: "OpenAI",
        key: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        base: "https://api.openai.com/v1",
      }
    : null;

  const gemini = env.GEMINI_API_KEY
    ? {
        name: "gemini",
        label: "Google Gemini",
        key: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL || "gemini-flash-latest",
        base: "https://generativelanguage.googleapis.com/v1beta/openai",
      }
    : null;

  if (forced === "openai") return openai;
  if (forced === "gemini") return gemini;
  return openai ?? gemini;
}

/**
 * Listing models is not enough — providers advertise models a given key cannot
 * actually call. Probe a few likely candidates with a one-token request and
 * return only the ones that genuinely answer.
 */
async function workingModels(provider, limit = 3) {
  try {
    const res = await fetch(`${provider.base}/models`, {
      headers: { Authorization: `Bearer ${provider.key}` },
    });
    if (!res.ok) return [];

    const ids = ((await res.json()).data ?? [])
      .map((m) => String(m.id).replace(/^models\//, ""))
      .filter((id) =>
        provider.name === "gemini"
          ? /^gemini-.*(flash|pro)/.test(id) &&
            !/embedding|vision|tts|image|audio|live|preview/.test(id)
          : /^gpt-/.test(id) && !/audio|realtime|instruct/.test(id),
      );

    // "-latest" aliases first: they survive version retirements.
    ids.sort((a, b) => Number(b.includes("latest")) - Number(a.includes("latest")));

    const found = [];
    for (const id of ids.slice(0, 8)) {
      if (found.length >= limit) break;
      const probe = await fetch(`${provider.base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: id,
          max_completion_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (probe.ok) found.push(id);
    }
    return found;
  } catch {
    return [];
  }
}

async function checkModel() {
  const provider = activeProvider();

  if (!provider) {
    return report(HM, "No model key set", [
      "The app will serve the bundled demo itinerary instead of generating.",
      "Free key, no credit card: https://aistudio.google.com/apikey",
      "Then put it in .env as GEMINI_API_KEY=...",
    ]);
  }

  if (env.OPENAI_API_KEY && env.GEMINI_API_KEY && !env.LLM_PROVIDER) {
    report(HM, "Both model keys are set", [
      `Using ${provider.label}. Set LLM_PROVIDER=gemini or =openai in .env to be explicit.`,
    ]);
  }

  // One call, capped at a single token — enough to prove auth, access and credit.
  const res = await fetch(`${provider.base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model,
      max_completion_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  if (res.ok) {
    return report(OK, `${provider.label} works — model "${provider.model}" is reachable`);
  }

  const body = await res.text();

  if (res.status === 401 || /API key not valid|invalid[_ ]api[_ ]key|Unauthorized/i.test(body)) {
    return report(NO, `${provider.label} rejected the key`, [
      provider.name === "gemini"
        ? "Get a fresh one at https://aistudio.google.com/apikey"
        : "Create a fresh one at platform.openai.com -> API keys.",
      "Check for a stray space or quote in .env.",
    ]);
  }
  if (res.status === 429 && /quota|billing|insufficient/i.test(body)) {
    if (provider.name === "openai") {
      return report(NO, "OpenAI key is valid but has no credit", [
        "New accounts start at $0 and every call returns this.",
        "Either add $5 at platform.openai.com -> Billing,",
        "or switch to the free tier: set GEMINI_API_KEY and LLM_PROVIDER=gemini.",
      ]);
    }

    // Gemini quota is per model, so an exhausted one does not mean the key is
    // spent — name the limit that was hit and models that still answer.
    const quota = body.match(/limit: (\d+), model: ([\w.-]+)/);
    const retry = body.match(/retry in ([\d.]+)s/i);
    const alternatives = await workingModels(provider);

    return report(NO, `Gemini quota exhausted on "${provider.model}"`, [
      quota ? `Free-tier limit is ${quota[1]} requests for ${quota[2]}.` : "",
      retry ? `Google suggests retrying in ${Math.ceil(Number(retry[1]))}s.` : "",
      "Quota is counted per model, so these still have allowance right now:",
      ...alternatives.filter((m) => m !== provider.model).map((m) => `  ${m}`),
      "Set one as GEMINI_MODEL in .env, or wait for the window to reset.",
    ]);
  }
  if (res.status === 429) {
    return report(HM, `${provider.label} rate limited`, ["Wait a minute and run this again."]);
  }
  if (/model_not_found|not found|no longer available|does not exist|do not have access/i.test(body)) {
    // Don't just report it — find out what this key can actually use.
    const usable = await workingModels(provider);
    return report(NO, `Your account cannot use "${provider.model}"`, [
      /no longer available/i.test(body)
        ? "Google retires pinned model versions for new accounts."
        : "",
      usable.length
        ? `Set one of these in .env as ${provider.name === "gemini" ? "GEMINI_MODEL" : "OPENAI_MODEL"}:`
        : "Could not list alternatives — check the provider's model list.",
      ...usable.map((m) => `  ${m}`),
    ]);
  }

  report(NO, `${provider.label} call failed (${res.status})`, [body.slice(0, 240)]);
}

/* ── place lookup ────────────────────────────────────────────── */

async function checkPlaces() {
  if (!env.GOOGLE_MAPS_API_KEY) {
    // No key is a valid, fully working configuration — say so clearly.
    try {
      const res = await fetch(
        "https://photon.komoot.io/api?q=Castelo%20de%20Sao%20Jorge%2C%20Lisbon&limit=1",
        { headers: { "User-Agent": "wayfare-doctor/1.0" } },
      );
      const json = await res.json();
      const name = json?.features?.[0]?.properties?.name;
      return report(OK, "Place lookup: OpenStreetMap (no key needed)", [
        name ? `Test lookup returned: ${name}` : "",
        "No star ratings or review counts — OSM does not hold that data.",
        "Add GOOGLE_MAPS_API_KEY for ratings, reviews and Google photos.",
      ]);
    } catch {
      return report(HM, "OpenStreetMap lookup unreachable", [
        "Check your internet connection; photon.komoot.io may also be briefly down.",
      ]);
    }
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating",
    },
    body: JSON.stringify({ textQuery: "Castelo de Sao Jorge, Lisbon", maxResultCount: 1 }),
  });

  const body = await res.text();

  if (res.ok) {
    let name = "";
    try {
      name = JSON.parse(body).places?.[0]?.displayName?.text ?? "";
    } catch {
      /* ignore */
    }
    return report(OK, "Place lookup: Google Places (New)", [
      name ? `Test lookup returned: ${name}` : "",
    ]);
  }

  const cases = [
    [
      /has not been used in project|is disabled/i,
      "Places API (New) is not enabled on this project",
      [
        "Google Cloud -> APIs & Services -> Library",
        'Search "Places API (New)" and press Enable. Wait a minute, then rerun.',
      ],
    ],
    [
      /legacy API|Places API \(Legacy\)/i,
      "You enabled the OLD Places API, not Places API (New)",
      ['They are two products with almost the same name. Enable "Places API (New)".'],
    ],
    [
      /billing/i,
      "Billing is not enabled on the Google Cloud project",
      [
        "Google Cloud -> Billing -> link a billing account to this project.",
        "No card? Leave GOOGLE_MAPS_API_KEY empty — OpenStreetMap needs none.",
      ],
    ],
    [
      /referer|referrer/i,
      "This key has a website restriction and cannot be used server-side",
      [
        "GOOGLE_MAPS_API_KEY must be the SERVER key.",
        "Credentials -> your key -> Application restrictions -> None (or IP addresses).",
      ],
    ],
    [
      /API key not valid|API_KEY_INVALID|expired/i,
      "The Google key itself is invalid",
      ["Check for a stray space or quote in .env, or create a new key."],
    ],
    [
      /not authorized|PERMISSION_DENIED|SERVICE_DISABLED/i,
      "The key is blocked from Places API (New)",
      ['Credentials -> your key -> API restrictions -> tick "Places API (New)".'],
    ],
  ];

  for (const [pattern, title, lines] of cases) {
    if (pattern.test(body)) return report(NO, title, lines);
  }

  report(NO, `Places API returned ${res.status}`, [body.slice(0, 280)]);
}

/* ── the map ─────────────────────────────────────────────────── */

async function checkMap() {
  const key = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return report(OK, "Map: Leaflet + OpenStreetMap tiles (no key needed)", [
      "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to use Google Maps instead.",
    ]);
  }

  const res = await fetch(`https://maps.googleapis.com/maps/api/js?key=${key}`, {
    headers: { Referer: "http://localhost:3000/" },
  });
  const body = await res.text();

  if (/ApiNotActivatedMapError|ApiTargetBlockedMapError/i.test(body)) {
    return report(NO, "Maps JavaScript API is not enabled for this key", [
      'APIs & Services -> Library -> "Maps JavaScript API" -> Enable',
    ]);
  }
  if (/InvalidKeyMapError|RefererNotAllowedMapError/i.test(body)) {
    return report(NO, "Browser key rejected for localhost", [
      "Credentials -> key -> Application restrictions -> Websites -> add http://localhost:3000/*",
    ]);
  }
  if (!res.ok) {
    return report(NO, `Maps JS bootstrap returned ${res.status}`, [body.slice(0, 200)]);
  }

  // Deliberately hedged: Google returns 200 for a completely made-up browser key
  // and only reports the failure in the browser at runtime.
  report(OK, "Map: Google Maps — no configuration error reported", [
    "This check is weak by nature: browser keys are rejected at runtime, not here.",
    "The real test is whether the map renders on a trip page.",
  ]);
}

/* ── run ─────────────────────────────────────────────────────── */

console.log("\nChecking configuration in .env");

await checkModel();
await checkPlaces();
await checkMap();

const provider = activeProvider();

if (failures) {
  console.log(`\n${NO} ${failures} problem(s) above. Fix them, then rerun: npm run doctor\n`);
} else if (!provider) {
  console.log(
    `\n${HM} No model key — the app runs, but serves the demo itinerary.\n` +
      `    Free key (no card): https://aistudio.google.com/apikey\n`,
  );
} else {
  console.log(`\n${OK} Ready. Next: npm run dev, then npm run verify\n`);
}

process.exitCode = failures ? 1 : 0;
