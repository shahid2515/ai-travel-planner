import OpenAI from "openai";
import { TRIP_JSON_SCHEMA } from "./openai-schema";
import type { GeneratedTrip, TripInput } from "./types";

/**
 * Model provider layer.
 *
 * The app talks to one OpenAI-shaped API. Google publishes an OpenAI-compatible
 * endpoint for Gemini, so the same SDK and the same code drive both — only the
 * base URL, key and model name change. Gemini's free tier needs no credit card,
 * which makes it the default when no OpenAI key is present.
 *
 * Adding another provider (Groq, Together, OpenRouter, a local Ollama) is a new
 * entry in PROVIDERS and nothing else.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/";

export type ProviderName = "openai" | "gemini";

export interface Provider {
  name: ProviderName;
  label: string;
  model: string;
  baseURL?: string;
  apiKey: string;
  /** Gemini rejects some JSON Schema keywords OpenAI requires. */
  strictSchema: boolean;
}

/**
 * Serverless platforms cap a request at 60s (Vercel Hobby). Measured on a
 * 7-day Tokyo itinerary:
 *
 *   gemini-flash-latest        62–67s   76–78% of venues verifiable
 *   gemini-flash-lite-latest   30s      67% of venues verifiable
 *
 * Output scales with trip length, so the quality model fits comfortably for
 * short trips and overruns for long ones. Rather than degrade every trip to
 * satisfy the longest, switch models at the point where the budget runs out.
 */
const LONG_TRIP_DAYS = 6;

export function resolveProvider(days = 0): Provider | null {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  const longTrip = days >= LONG_TRIP_DAYS;

  const openai = process.env.OPENAI_API_KEY
    ? {
        name: "openai" as const,
        label: "OpenAI",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
        strictSchema: true,
      }
    : null;

  const gemini = process.env.GEMINI_API_KEY
    ? {
        name: "gemini" as const,
        label: "Google Gemini",
        /**
         * Pinned, not "-latest".
         *
         * The alias looks safer — it survives model retirements — but free-tier
         * quota is per model, and the alias tracks whichever model is newest,
         * which is where the allowance is smallest. gemini-flash-latest resolved
         * to a model capped at 20 requests and exhausted itself during testing.
         * A stable version has a far larger allowance. Retirement is a slower,
         * louder failure than a demo dying at request 21, and `npm run doctor`
         * names a working replacement when it happens.
         */
        model: longTrip
          ? process.env.GEMINI_MODEL_LONG || "gemini-3.5-flash-lite"
          : process.env.GEMINI_MODEL || "gemini-3.5-flash",
        baseURL: GEMINI_BASE,
        apiKey: process.env.GEMINI_API_KEY,
        strictSchema: false,
      }
    : null;

  if (forced === "openai") return openai;
  if (forced === "gemini") return gemini;

  // Auto: whichever key is present. OpenAI wins a tie — set LLM_PROVIDER to override.
  return openai ?? gemini;
}

export const hasModelProvider = () => resolveProvider() !== null;

let cached: { key: string; client: OpenAI } | null = null;

function clientFor(provider: Provider) {
  const key = `${provider.name}:${provider.apiKey.slice(-8)}`;
  if (cached?.key !== key) {
    cached = {
      key,
      client: new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL }),
    };
  }
  return cached.client;
}

/**
 * OpenAI's strict mode requires `additionalProperties: false` on every object.
 * Gemini's schema validator rejects that keyword outright, so strip it for
 * providers that cannot take it.
 */
function relaxSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(relaxSchema);
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>)
        .filter(([k]) => k !== "additionalProperties")
        .map(([k, v]) => [k, relaxSchema(v)]),
    );
  }
  return node;
}

/* ── prompt ──────────────────────────────────────────────────── */

const PACE_BRIEF: Record<string, string> = {
  relaxed: "3–4 activities a day, long meals, plenty of unscheduled time, no early starts.",
  balanced: "5–6 activities a day with a real break in the afternoon.",
  packed: "7–8 activities a day, early starts, tight but achievable transitions.",
};

const SYSTEM_PROMPT = `You are a meticulous travel planner who has personally spent time in the destination.

Hard rules:
- Only name venues that genuinely exist and are still open. Every name must match its listing on maps exactly. If you are not certain a place exists, leave it out — a shorter honest plan beats an invented one.
- Respect the budget. Costs must be realistic for the destination and the travel dates, quoted in the requested currency, and the category breakdown must add up to the total.
- Group each day geographically. Never send travellers back and forth across a city.
- Every activity that happens at a listed place must repeat that place's name exactly in placeName so it can be matched to a map pin.
- Include every meal in the day plans, drawn from the restaurants list where it fits.
- Opening times, queues and travel time between stops are part of the plan. Say when to pre-book.
- Be specific and concrete. No filler such as "explore the local culture" or "enjoy the vibrant atmosphere".`;

function buildUserPrompt(input: TripInput, dates: string[]) {
  const when = input.startDate
    ? `Travel dates: ${dates[0]} to ${dates[dates.length - 1]} (${input.days} days).`
    : `Trip length: ${input.days} days. No fixed dates — assume a typical shoulder-season visit.`;

  const interests = input.interests.length
    ? input.interests.join(", ")
    : "no strong preferences — cover the destination's highlights";

  return [
    `Destination: ${input.destination}`,
    when,
    `Travellers: ${input.travelers}`,
    `Total budget for the whole group, excluding flights: ${input.budget} ${input.currency}`,
    `Pace: ${input.pace} — ${PACE_BRIEF[input.pace] ?? PACE_BRIEF.balanced}`,
    `Interests: ${interests}`,
    input.notes ? `Extra requirements from the traveller: ${input.notes}` : "",
    "",
    `Produce exactly ${input.days} day plans, numbered 1 to ${input.days}.`,
    `Every monetary figure must be a plain number in ${input.currency} with no symbols.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ── generation ──────────────────────────────────────────────── */

export class MissingModelKeyError extends Error {
  constructor() {
    super("No model provider configured — set GEMINI_API_KEY or OPENAI_API_KEY");
    this.name = "MissingModelKeyError";
  }
}

export async function generateTrip(input: TripInput, dates: string[]): Promise<GeneratedTrip> {
  const provider = resolveProvider(input.days);
  if (!provider) throw new MissingModelKeyError();

  const client = clientFor(provider);
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(input, dates) },
  ];

  const schema = provider.strictSchema
    ? TRIP_JSON_SCHEMA.schema
    : (relaxSchema(TRIP_JSON_SCHEMA.schema) as Record<string, unknown>);

  let raw: string | null = null;

  try {
    const completion = await client.chat.completions.create({
      model: provider.model,
      temperature: 0.7,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: TRIP_JSON_SCHEMA.name,
          // strict is an OpenAI-only guarantee; Gemini errors on it.
          ...(provider.strictSchema ? { strict: true } : {}),
          schema: schema as Record<string, unknown>,
        },
      },
    });

    const message = completion.choices[0]?.message;
    if (message?.refusal) throw new Error(`The model refused the request: ${message.refusal}`);
    raw = message?.content ?? null;
  } catch (err) {
    const status = (err as { status?: number })?.status;

    // Only a 400 means "I don't like this schema". A 429, 401 or 5xx is about
    // the account or the service, and retrying immediately just spends another
    // request against the same limit — which is exactly what this used to do
    // on every free-tier rate limit.
    if (status !== 400) throw err;

    // Fall back to plain JSON mode with the shape described in the prompt.
    console.warn(`[llm] ${provider.name} rejected json_schema, retrying in json mode:`, err);

    const completion = await client.chat.completions.create({
      model: provider.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        ...messages,
        {
          role: "user" as const,
          content:
            "Reply with JSON only, conforming exactly to this JSON Schema. " +
            "No markdown, no commentary.\n\n" +
            JSON.stringify(schema),
        },
      ],
    });

    raw = completion.choices[0]?.message?.content ?? null;
  }

  if (!raw) throw new Error("The model returned an empty itinerary");

  const trip = parseTrip(raw);
  return normaliseTrip(trip, input);
}

/** Models occasionally wrap JSON in a markdown fence even when told not to. */
function parseTrip(raw: string): GeneratedTrip {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The model returned something that was not valid JSON");
  }

  const trip = parsed as GeneratedTrip;
  const missing = (["title", "days", "places", "restaurants", "budget"] as const).filter(
    (k) => trip?.[k] === undefined,
  );
  if (missing.length) {
    throw new Error(`The itinerary was missing required fields: ${missing.join(", ")}`);
  }
  if (!Array.isArray(trip.days) || trip.days.length === 0) {
    throw new Error("The itinerary came back with no days");
  }

  return trip;
}

/** Guard rails for the handful of things a schema cannot enforce. */
function normaliseTrip(trip: GeneratedTrip, input: TripInput): GeneratedTrip {
  const days = [...(trip.days ?? [])]
    .sort((a, b) => a.day - b.day)
    .slice(0, input.days)
    .map((day, i) => ({
      ...day,
      day: i + 1,
      activities: [...(day.activities ?? [])].sort((a, b) =>
        String(a.time).localeCompare(String(b.time)),
      ),
    }));

  const breakdown = (trip.budget?.breakdown ?? []).filter((b) => b.amount > 0);
  const total = trip.budget?.total || breakdown.reduce((sum, b) => sum + b.amount, 0);

  return {
    ...trip,
    days,
    places: trip.places ?? [],
    restaurants: trip.restaurants ?? [],
    tips: trip.tips ?? [],
    packingList: trip.packingList ?? [],
    budget: {
      ...trip.budget,
      total,
      perPerson: Math.round(total / Math.max(1, input.travelers)),
      breakdown,
    },
  };
}
