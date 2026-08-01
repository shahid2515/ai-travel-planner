import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/session";
import { deleteTrip, getTrip } from "@/lib/trips";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  const deleted = await deleteTrip(id, ownerId);
  if (!deleted) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
