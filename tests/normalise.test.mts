import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normaliseTrip } from "../src/lib/normalise.ts";
import type { GeneratedTrip, TripInput } from "../src/lib/types.ts";

/**
 * These cover the failures a JSON Schema cannot catch. Every case here is one
 * a model has actually produced during testing.
 */

const input = (over: Partial<TripInput> = {}): TripInput => ({
  destination: "Lisbon",
  days: 3,
  travelers: 2,
  budget: 1500,
  currency: "USD",
  pace: "balanced",
  interests: [],
  startDate: "",
  notes: "",
  ...over,
});

const day = (n: number, activities: { time: string; title: string }[] = []) => ({
  day: n,
  title: `Day ${n}`,
  theme: "",
  neighborhood: "",
  estimatedCost: 0,
  tip: "",
  activities: activities.map((a) => ({
    ...a,
    type: "attraction" as const,
    placeName: "",
    description: "",
    durationMinutes: 60,
    estimatedCost: 0,
    travelNote: "",
  })),
});

const trip = (over: Partial<GeneratedTrip> = {}): GeneratedTrip =>
  ({
    title: "Trip",
    summary: "",
    city: "Lisbon",
    country: "Portugal",
    budget: { total: 1500, perPerson: 999, breakdown: [], verdict: "" },
    places: [],
    restaurants: [],
    days: [day(1), day(2), day(3)],
    tips: [],
    packingList: [],
    ...over,
  }) as GeneratedTrip;

describe("day handling", () => {
  test("extra days are dropped — they would render as phantom tabs", () => {
    const out = normaliseTrip(trip({ days: [day(1), day(2), day(3), day(4), day(5)] }), input());
    assert.equal(out.days.length, 3);
  });

  test("days are renumbered contiguously after sorting", () => {
    const out = normaliseTrip(trip({ days: [day(3), day(1), day(2)] }), input());
    assert.deepEqual(
      out.days.map((d) => d.day),
      [1, 2, 3],
    );
  });

  test("activities are sorted chronologically", () => {
    const messy = day(1, [
      { time: "18:00", title: "dinner" },
      { time: "09:00", title: "morning" },
      { time: "13:00", title: "lunch" },
    ]);
    const out = normaliseTrip(trip({ days: [messy] }), input({ days: 1 }));
    assert.deepEqual(
      out.days[0].activities.map((a) => a.time),
      ["09:00", "13:00", "18:00"],
    );
  });

  test("fewer days than requested are left alone — better short than padded", () => {
    const out = normaliseTrip(trip({ days: [day(1)] }), input({ days: 5 }));
    assert.equal(out.days.length, 1);
  });
});

describe("budget", () => {
  test("per-person is recomputed, never trusted", () => {
    const out = normaliseTrip(trip(), input({ travelers: 4 }));
    assert.equal(out.budget.perPerson, 375); // 1500 / 4, not the model's 999
  });

  test("total is derived from the breakdown when the model omits it", () => {
    const out = normaliseTrip(
      trip({
        budget: {
          total: 0,
          perPerson: 0,
          verdict: "",
          breakdown: [
            { category: "food", amount: 400, note: "" },
            { category: "accommodation", amount: 600, note: "" },
          ],
        },
      }),
      input({ travelers: 2 }),
    );
    assert.equal(out.budget.total, 1000);
    assert.equal(out.budget.perPerson, 500);
  });

  test("zero-amount categories are dropped from the chart", () => {
    const out = normaliseTrip(
      trip({
        budget: {
          total: 500,
          perPerson: 0,
          verdict: "",
          breakdown: [
            { category: "food", amount: 500, note: "" },
            { category: "shopping", amount: 0, note: "" },
          ],
        },
      }),
      input(),
    );
    assert.equal(out.budget.breakdown.length, 1);
  });

  test("a single traveller never divides by zero", () => {
    const out = normaliseTrip(trip(), input({ travelers: 1 }));
    assert.equal(out.budget.perPerson, 1500);
  });
});

describe("missing collections", () => {
  test("absent arrays become empty ones rather than crashing the page", () => {
    const partial = {
      title: "t",
      summary: "",
      city: "",
      country: "",
      budget: { total: 100, perPerson: 0, breakdown: [], verdict: "" },
      days: [day(1)],
    } as unknown as GeneratedTrip;

    const out = normaliseTrip(partial, input({ days: 1 }));
    assert.deepEqual(out.places, []);
    assert.deepEqual(out.restaurants, []);
    assert.deepEqual(out.tips, []);
    assert.deepEqual(out.packingList, []);
  });
});
