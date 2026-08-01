import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allStops, findByName, mapCenter, stopsForDay, tripTotals } from "../src/lib/trip-utils.ts";
import type { PlaceMatch, TripPayload } from "../src/lib/types.ts";

const google = (name: string, lat: number, lng: number): PlaceMatch => ({
  placeId: `osm:${name}`,
  name,
  address: "",
  lat,
  lng,
  rating: null,
  reviewCount: null,
  priceLevel: null,
  photo: null,
  mapsUrl: null,
  website: null,
  openNow: null,
  types: [],
});

const payload = (): TripPayload =>
  ({
    input: { days: 1, travelers: 2, currency: "USD" },
    destination: { name: "Lisbon", country: "PT", lat: 38.7, lng: -9.1, photo: null, placeId: null },
    dates: [],
    demo: false,
    generatedAt: "",
    places: [
      { name: "Castelo", google: google("Castelo", 38.71, -9.13) },
      { name: "Torre", google: null }, // deliberately unlocated
    ],
    restaurants: [{ name: "Ramiro", cuisine: "Seafood", google: google("Ramiro", 38.72, -9.14) }],
    trip: {
      days: [
        {
          day: 1,
          activities: [
            { time: "09:00", placeName: "Castelo" },
            { time: "11:00", placeName: "" }, // free wandering, no venue
            { time: "13:00", placeName: "Ramiro" },
            { time: "15:00", placeName: "Torre" }, // real activity, no coordinates
          ],
        },
      ],
    },
  }) as unknown as TripPayload;

describe("findByName", () => {
  test("matches a place regardless of case and spacing", () => {
    assert.equal(findByName(payload(), "  castelo ")?.name, "Castelo");
  });

  test("falls through to restaurants", () => {
    assert.equal(findByName(payload(), "Ramiro")?.name, "Ramiro");
  });

  test("returns null for an unknown or empty name", () => {
    assert.equal(findByName(payload(), "Nowhere"), null);
    assert.equal(findByName(payload(), ""), null);
  });
});

describe("stopsForDay", () => {
  test("only venues with coordinates get a pin", () => {
    const stops = stopsForDay(payload(), 0);
    assert.deepEqual(
      stops.map((s) => s.name),
      ["Castelo", "Ramiro"],
    );
  });

  test("numbering is contiguous even when activities are skipped", () => {
    // The unlocated Torre must not leave a gap like 1, 3.
    assert.deepEqual(
      stopsForDay(payload(), 0).map((s) => s.label),
      ["1", "2"],
    );
  });

  test("activityIndex points back at the right timeline row", () => {
    const stops = stopsForDay(payload(), 0);
    assert.deepEqual(
      stops.map((s) => s.activityIndex),
      [0, 2],
    );
  });

  test("restaurants are distinguished from places for pin colour", () => {
    assert.deepEqual(
      stopsForDay(payload(), 0).map((s) => s.kind),
      ["place", "restaurant"],
    );
  });

  test("a day that does not exist yields no stops", () => {
    assert.deepEqual(stopsForDay(payload(), 9), []);
  });
});

describe("allStops", () => {
  test("covers every located venue in the trip", () => {
    assert.equal(allStops(payload()).length, 2);
  });
});

describe("mapCenter", () => {
  test("prefers the resolved destination", () => {
    assert.deepEqual(mapCenter(payload(), []), { lat: 38.7, lng: -9.1 });
  });

  test("averages the stops when the destination could not be located", () => {
    const p = payload();
    p.destination.lat = null;
    p.destination.lng = null;
    const c = mapCenter(p, allStops(p));
    assert.ok(c && Math.abs(c.lat - 38.715) < 0.001, JSON.stringify(c));
  });

  test("null when there is nothing to centre on", () => {
    const p = payload();
    p.destination.lat = null;
    p.destination.lng = null;
    assert.equal(mapCenter(p, []), null);
  });
});

describe("tripTotals", () => {
  test("counts located venues against the total", () => {
    const t = tripTotals(payload());
    assert.equal(t.totalVenues, 3);
    assert.equal(t.located, 2);
    assert.equal(t.activities, 4);
  });
});
