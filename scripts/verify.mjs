/**
 * Live verification harness.
 *
 *   npm run dev          # in one terminal
 *   npm run verify       # in another
 *
 * Generates several real trips against the running app and audits each one.
 * An LLM can return valid JSON that is still a bad itinerary — wrong number of
 * days, times running backwards, a budget that does not add up, venues that do
 * not exist. The schema cannot catch any of that; these checks can.
 *
 * Exit code is non-zero if any FAIL fires, so this can gate a deploy.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ONLY = process.argv[2]; // optional substring filter, e.g. `npm run verify tokyo`

const SCENARIOS = [
  {
    name: "Lisbon · 3 days · couple · mid budget",
    body: {
      destination: "Lisbon, Portugal",
      days: 3,
      travelers: 2,
      budget: 1500,
      currency: "USD",
      pace: "balanced",
      interests: ["Food & drink", "History & culture"],
      startDate: "",
      notes: "",
    },
  },
  {
    name: "Tokyo · 7 days · solo · tight budget",
    body: {
      destination: "Tokyo, Japan",
      days: 7,
      travelers: 1,
      budget: 1200,
      currency: "USD",
      pace: "packed",
      interests: ["Food & drink", "Architecture", "Local markets"],
      startDate: "",
      notes: "No taxis, public transport only.",
    },
  },
  {
    name: "Mexico City · 5 days · family · relaxed",
    body: {
      destination: "Mexico City, Mexico",
      days: 5,
      travelers: 4,
      budget: 4000,
      currency: "USD",
      pace: "relaxed",
      interests: ["Family friendly", "Art & museums", "Food & drink"],
      startDate: "",
      notes: "Travelling with a 6-year-old. No late nights.",
    },
  },
  {
    name: "Marrakech · 2 days · couple · EUR",
    body: {
      destination: "Marrakech, Morocco",
      days: 2,
      travelers: 2,
      budget: 900,
      currency: "EUR",
      pace: "balanced",
      interests: ["Local markets", "Photography"],
      startDate: "",
      notes: "",
    },
  },
];

/* ── check helpers ───────────────────────────────────────────── */

const results = [];
const record = (scenario, level, label, detail = "") =>
  results.push({ scenario, level, label, detail });

const ICON = { PASS: "✓", WARN: "!", FAIL: "✗", INFO: "·" };
const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 100));

function audit(scenario, input, payload) {
  const check = (ok, label, detail, failLevel = "FAIL") =>
    record(scenario, ok ? "PASS" : failLevel, label, ok ? "" : detail);

  const { trip, places, restaurants, destination } = payload;

  /* structure */
  check(
    trip.days.length === input.days,
    "day count matches request",
    `asked for ${input.days}, got ${trip.days.length}`,
  );
  check(places.length >= 8, "8+ places", `only ${places.length}`, "WARN");
  check(restaurants.length >= 6, "6+ restaurants", `only ${restaurants.length}`, "WARN");

  const dupes = [...places, ...restaurants]
    .map((p) => p.name.toLowerCase())
    .filter((n, i, a) => a.indexOf(n) !== i);
  check(dupes.length === 0, "no duplicate venues", `repeated: ${[...new Set(dupes)].join(", ")}`);

  /* each day */
  let thinDays = 0;
  let unordered = 0;
  let mealless = 0;

  for (const day of trip.days) {
    if (day.activities.length < 4) thinDays++;
    if (!day.activities.some((a) => a.type === "meal")) mealless++;
    const times = day.activities.map((a) => a.time);
    if (times.some((t, i) => i > 0 && t < times[i - 1])) unordered++;
  }

  check(unordered === 0, "activity times run forwards", `${unordered} day(s) out of order`);
  check(thinDays === 0, "every day has 4+ activities", `${thinDays} thin day(s)`, "WARN");
  check(mealless === 0, "every day includes a meal", `${mealless} day(s) with no meal`, "WARN");

  /* budget arithmetic */
  const sum = trip.budget.breakdown.reduce((s, b) => s + b.amount, 0);
  const drift = trip.budget.total ? Math.abs(sum - trip.budget.total) / trip.budget.total : 1;
  check(
    drift <= 0.02,
    "breakdown adds up to total",
    `sum ${Math.round(sum)} vs total ${Math.round(trip.budget.total)} (${Math.round(drift * 100)}% off)`,
  );

  const expectedPP = Math.round(trip.budget.total / input.travelers);
  check(
    Math.abs(trip.budget.perPerson - expectedPP) <= 1,
    "per-person figure is consistent",
    `${trip.budget.perPerson} vs expected ${expectedPP}`,
  );

  const overBy = pct(trip.budget.total - input.budget, input.budget);
  check(
    overBy <= 10,
    "stays near the stated budget",
    `${overBy}% over the ${input.budget} ${input.currency} budget`,
    "WARN",
  );

  /* the part the schema cannot guarantee: do these venues exist? */
  const venues = [...places, ...restaurants];
  const matched = venues.filter((v) => v.google).length;
  const matchRate = pct(matched, venues.length);
  record(
    scenario,
    payload.demo ? "INFO" : matchRate >= 70 ? "PASS" : matchRate >= 50 ? "WARN" : "FAIL",
    "venues verified in the place database",
    `${matched}/${venues.length} (${matchRate}%)`,
  );

  const unmatched = venues.filter((v) => !v.google).map((v) => v.name);
  if (unmatched.length && !payload.demo) {
    record(scenario, "INFO", "unmatched venues", unmatched.join(" · "));
  }

  /* activities must point at venues that are actually in the lists */
  const names = new Set(venues.map((v) => v.name.trim().toLowerCase()));
  const linked = trip.days.flatMap((d) => d.activities).filter((a) => a.placeName);
  const resolved = linked.filter((a) => names.has(a.placeName.trim().toLowerCase()));
  const linkRate = pct(resolved.length, linked.length);
  check(
    linkRate >= 90,
    "activity placeName links to a listed venue",
    `${resolved.length}/${linked.length} resolve (${linkRate}%)`,
    linkRate >= 75 ? "WARN" : "FAIL",
  );

  /* map + hero */
  const pinnable = venues.filter((v) => v.google?.lat && v.google?.lng).length;
  record(scenario, payload.demo ? "INFO" : pinnable > 0 ? "PASS" : "FAIL", "map pins available", `${pinnable}`);
  record(
    scenario,
    payload.demo ? "INFO" : destination.photo ? "PASS" : "WARN",
    "hero photo resolved",
    destination.photo ? "" : "no photo for the destination",
  );

  /* content sanity */
  const filler = /explore the local culture|vibrant atmosphere|immerse yourself|hidden gem/i;
  const fillerHits = trip.days
    .flatMap((d) => d.activities)
    .filter((a) => filler.test(a.description)).length;
  check(fillerHits === 0, "no filler phrasing", `${fillerHits} generic description(s)`, "WARN");

  check(trip.tips.length >= 4, "4+ local tips", `only ${trip.tips.length}`, "WARN");
  check(trip.packingList.length >= 5, "5+ packing items", `only ${trip.packingList.length}`, "WARN");
}

/* ── runner ──────────────────────────────────────────────────── */

// Trips are owned by the `tp_owner` cookie the server sets on first write, so the
// harness has to carry it or its own cleanup DELETEs match nothing.
let cookie = "";

async function run(scenario) {
  const started = Date.now();

  const res = await fetch(`${BASE}/api/trips/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(scenario.body),
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const owner = setCookie.find((c) => c.startsWith("tp_owner="));
  if (owner) cookie = owner.split(";")[0];

  const json = await res.json();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (!res.ok) {
    record(scenario.name, "FAIL", "generation", `${res.status} — ${json.error ?? "unknown error"}`);
    return { seconds, demo: null };
  }

  const trip = await (await fetch(`${BASE}/api/trips/${json.id}`)).json();
  record(scenario.name, "INFO", "generated", `${seconds}s · ${BASE}/trips/${json.id}`);

  audit(scenario.name, scenario.body, trip);

  // Leave the database as we found it; pass --keep to inspect the trips in the UI.
  if (!process.argv.includes("--keep")) {
    const del = await fetch(`${BASE}/api/trips/${json.id}`, {
      method: "DELETE",
      headers: cookie ? { cookie } : {},
    }).catch(() => null);
    if (!del?.ok) record(scenario.name, "WARN", "cleanup", "could not delete the generated trip");
  }

  return { seconds, demo: trip.demo };
}

const chosen = ONLY
  ? SCENARIOS.filter((s) => s.name.toLowerCase().includes(ONLY.toLowerCase()))
  : SCENARIOS;

if (!chosen.length) {
  console.error(`No scenario matches "${ONLY}"`);
  process.exit(1);
}

console.log(`\nVerifying ${chosen.length} scenario(s) against ${BASE}\n`);

let demoMode = false;

for (const scenario of chosen) {
  process.stdout.write(`  ${scenario.name} … `);
  try {
    const { seconds, demo } = await run(scenario);
    if (demo) demoMode = true;
    console.log(`${seconds}s`);
  } catch (err) {
    record(scenario.name, "FAIL", "request threw", String(err.message ?? err));
    console.log("error");
  }
}

/* ── report ──────────────────────────────────────────────────── */

console.log();
for (const scenario of chosen) {
  const rows = results.filter((r) => r.scenario === scenario.name);
  if (!rows.length) continue;

  console.log(`\n${scenario.name}`);
  console.log("─".repeat(Math.min(72, scenario.name.length + 12)));
  for (const r of rows) {
    const detail = r.detail ? `  — ${r.detail}` : "";
    console.log(`  ${ICON[r.level]} ${r.label}${detail}`);
  }
}

const fails = results.filter((r) => r.level === "FAIL");
const warns = results.filter((r) => r.level === "WARN");

console.log(
  `\n${fails.length ? "✗" : "✓"} ${fails.length} failed · ${warns.length} warnings · ` +
    `${results.filter((r) => r.level === "PASS").length} passed`,
);

if (demoMode) {
  console.log(
    "\nNote: ran in DEMO MODE (no OPENAI_API_KEY). Google-dependent checks were\n" +
      "reported as INFO rather than pass/fail. Add keys to .env for a real run.",
  );
}

// exitCode rather than exit() — Node on Windows asserts if it tears down while
// keep-alive sockets from fetch are still open.
process.exitCode = fails.length ? 1 : 0;
