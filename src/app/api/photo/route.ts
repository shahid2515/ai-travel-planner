import { NextResponse } from "next/server";
import { resolvePhotoUrl } from "@/lib/places";

/**
 * Places photos need the server API key to resolve. Proxying them keeps the key
 * out of the HTML and gives us one place to cache.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const width = Number(searchParams.get("w")) || 900;

  if (!name || !name.startsWith("places/")) {
    return NextResponse.json({ error: "Bad photo reference" }, { status: 400 });
  }

  const url = await resolvePhotoUrl(name, Math.min(Math.max(width, 100), 1600));
  if (!url) return NextResponse.json({ error: "Photo unavailable" }, { status: 404 });

  return NextResponse.redirect(url, {
    status: 307,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
