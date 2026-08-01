import { NextResponse } from "next/server";
import { autocompleteCities } from "@/lib/places";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await autocompleteCities(q);
  return NextResponse.json({ suggestions });
}
