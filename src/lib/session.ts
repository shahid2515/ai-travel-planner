import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE = "tp_owner";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Trips are owned by an anonymous browser id rather than a logged-in user.
 * When real auth is added, this is the single function that changes:
 * return the session user's id instead.
 */
export async function getOwnerId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  // Route handlers and server actions may write cookies; RSC renders may not.
  try {
    jar.set(COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    });
  } catch {
    /* read-only context — the id will be persisted on the next mutation */
  }
  return id;
}