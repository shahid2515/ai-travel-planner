import { countTripsSince } from "./trips";

/**
 * Generation limits.
 *
 * A public demo with an open generate endpoint is someone else's free compute.
 * Two ceilings, because they protect against different things:
 *
 *   per visitor  — stops one person sitting on the button
 *   global       — stops the whole free-tier quota being drained in an hour,
 *                  which would leave the demo dead for everyone including you
 *
 * Both are counted from the trips table, so they hold across serverless
 * instances and restarts. Raise them with env vars once you are on a paid tier.
 *
 * Known weakness: the count comes from rows a visitor can delete, so someone
 * deliberately deleting their trips resets their own hourly allowance. That
 * stops bots and accidents, which is what a demo needs, but it is not real
 * abuse protection. The fix is an append-only GenerationLog table that delete
 * never touches — worth doing if this ever handles paid traffic.
 */

const PER_VISITOR_HOURLY = Number(process.env.RATE_LIMIT_PER_VISITOR ?? 5);
const GLOBAL_DAILY = Number(process.env.RATE_LIMIT_GLOBAL_DAILY ?? 40);

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export async function checkRateLimit(ownerId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [byVisitor, globally] = await Promise.all([
    countTripsSince(hourAgo, ownerId),
    countTripsSince(dayAgo),
  ]);

  if (byVisitor >= PER_VISITOR_HOURLY) {
    return {
      allowed: false,
      reason: `You have generated ${byVisitor} trips in the last hour, which is the limit on this demo. Your saved trips are all still there — try again a little later.`,
      retryAfterSeconds: 60 * 30,
    };
  }

  if (globally >= GLOBAL_DAILY) {
    return {
      allowed: false,
      reason:
        "This demo has hit its daily generation limit. It runs on a free API tier, so the cap is what keeps it alive. Browse the saved trips, or come back tomorrow.",
      retryAfterSeconds: 60 * 60,
    };
  }

  return { allowed: true };
}
