import { prisma } from "./db";
import type { TripPayload, TripRecord, TripSummaryRecord } from "./types";

export async function saveTrip(ownerId: string, payload: TripPayload): Promise<string> {
  const { input, trip, destination } = payload;

  const row = await prisma.trip.create({
    data: {
      ownerId,
      title: trip.title,
      summary: trip.summary,
      city: trip.city || destination.name || input.destination,
      country: trip.country || destination.country || "",
      lat: destination.lat,
      lng: destination.lng,
      startDate: input.startDate || null,
      days: input.days,
      travelers: input.travelers,
      budget: input.budget,
      currency: input.currency,
      pace: input.pace,
      heroPhoto: destination.photo,
      data: JSON.stringify(payload),
    },
    select: { id: true },
  });

  return row.id;
}

export async function listTrips(ownerId: string): Promise<TripSummaryRecord[]> {
  const rows = await prisma.trip.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      city: true,
      country: true,
      days: true,
      travelers: true,
      budget: true,
      currency: true,
      startDate: true,
      heroPhoto: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getTrip(id: string): Promise<TripRecord | null> {
  const row = await prisma.trip.findUnique({ where: { id } });
  if (!row) return null;

  try {
    const payload = JSON.parse(row.data) as TripPayload;
    return { ...payload, id: row.id, createdAt: row.createdAt.toISOString() };
  } catch {
    return null;
  }
}

export async function deleteTrip(id: string, ownerId: string) {
  const result = await prisma.trip.deleteMany({ where: { id, ownerId } });
  return result.count > 0;
}

export async function countTrips(ownerId: string) {
  return prisma.trip.count({ where: { ownerId } });
}

/**
 * Rate limiting is done against the database rather than an in-memory counter.
 *
 * On a serverless host every request may hit a fresh instance, so an in-process
 * Map forgets constantly and enforces nothing. Trips are already persisted with
 * an owner and a timestamp, so counting them is both accurate and free.
 */
export async function countTripsSince(since: Date, ownerId?: string) {
  return prisma.trip.count({
    where: { createdAt: { gte: since }, ...(ownerId ? { ownerId } : {}) },
  });
}
