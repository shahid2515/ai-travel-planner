import { NextResponse } from "next/server";
import { planTrip } from "@/lib/plan";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOwnerId } from "@/lib/session";
import { saveTrip } from "@/lib/trips";
import { tripInputSchema } from "@/lib/types";

// Generation takes 15–40s depending on trip length. Vercel's Hobby ceiling is 60s.
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = tripInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the form and try again",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 422 },
    );
  }

  const ownerId = await getOwnerId();

  const limit = await checkRateLimit(ownerId);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason },
      {
        status: 429,
        headers: limit.retryAfterSeconds
          ? { "Retry-After": String(limit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  try {
    const payload = await planTrip(parsed.data);
    const id = await saveTrip(ownerId, payload);
    return NextResponse.json({ id, demo: payload.demo });
  } catch (err) {
    console.error("[generate] failed", err);

    // The SDK carries the HTTP status; the message often does not. Matching on
    // text alone reported a free-tier rate limit as "could not build that
    // itinerary", which sends people looking for the wrong problem.
    const status = (err as { status?: number })?.status;
    const text = err instanceof Error ? err.message : "";

    if (status === 429 || /rate limit|quota|insufficient/i.test(text)) {
      return NextResponse.json(
        {
          error:
            "The model provider is rate limiting us — that is the free tier doing its job. Wait a minute and try again.",
        },
        { status: 429 },
      );
    }

    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "The model API key was rejected. Run `npm run doctor` to see why." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Could not build that itinerary. Try again, or adjust the destination." },
      { status: 502 },
    );
  }
}
