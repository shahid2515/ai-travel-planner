import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildDates,
  cn,
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
  photoSrc,
  relativeDate,
} from "../src/lib/utils.ts";

describe("buildDates", () => {
  test("returns one ISO date per day", () => {
    assert.deepEqual(buildDates("2026-09-10", 3), ["2026-09-10", "2026-09-11", "2026-09-12"]);
  });

  test("crosses a month boundary", () => {
    assert.deepEqual(buildDates("2026-01-30", 3), ["2026-01-30", "2026-01-31", "2026-02-01"]);
  });

  test("handles a leap day", () => {
    assert.deepEqual(buildDates("2028-02-28", 2), ["2028-02-28", "2028-02-29"]);
  });

  test("empty when no start date — trips can be undated", () => {
    assert.deepEqual(buildDates(null, 3), []);
    assert.deepEqual(buildDates("", 3), []);
  });

  test("empty on a malformed date rather than throwing", () => {
    assert.deepEqual(buildDates("not-a-date", 3), []);
  });
});

describe("formatMoney", () => {
  test("formats known currencies with no decimals", () => {
    assert.equal(formatMoney(1500, "USD"), "$1,500");
    assert.equal(formatMoney(1500, "EUR"), "€1,500");
  });

  test("rounds rather than truncating", () => {
    assert.equal(formatMoney(1500.6, "USD"), "$1,501");
  });

  test("treats zero and NaN as zero, never NaN in the UI", () => {
    assert.equal(formatMoney(0, "USD"), "$0");
    assert.equal(formatMoney(Number.NaN, "USD"), "$0");
  });

  test("falls back gracefully on an unknown currency code", () => {
    const out = formatMoney(1500, "XYZ");
    assert.ok(out.includes("1,500"), out);
  });
});

describe("formatDuration", () => {
  test("minutes under an hour", () => assert.equal(formatDuration(45), "45m"));
  test("whole hours drop the minutes", () => assert.equal(formatDuration(120), "2h"));
  test("hours and minutes", () => assert.equal(formatDuration(90), "1h 30m"));
  test("zero renders as nothing, not '0m'", () => {
    assert.equal(formatDuration(0), "");
    assert.equal(formatDuration(-5), "");
  });
});

describe("formatTime", () => {
  test("converts 24-hour to 12-hour", () => {
    assert.equal(formatTime("09:30"), "9:30 AM");
    assert.equal(formatTime("14:05"), "2:05 PM");
  });

  test("midnight and noon are the classic off-by-twelve traps", () => {
    assert.equal(formatTime("00:15"), "12:15 AM");
    assert.equal(formatTime("12:00"), "12:00 PM");
  });

  test("passes through anything unparseable instead of showing NaN", () => {
    assert.equal(formatTime("later"), "later");
  });
});

describe("photoSrc", () => {
  test("absolute URLs pass through — OpenStreetMap/Wikipedia photos", () => {
    const url = "https://upload.wikimedia.org/a/b.jpg";
    assert.equal(photoSrc(url), url);
  });

  test("Google resource names are proxied so the key stays server-side", () => {
    assert.equal(
      photoSrc("places/ABC/photos/XYZ", 600),
      "/api/photo?name=places%2FABC%2Fphotos%2FXYZ&w=600",
    );
  });

  test("null in, null out", () => {
    assert.equal(photoSrc(null), null);
    assert.equal(photoSrc(undefined), null);
  });
});

describe("misc helpers", () => {
  test("cn drops falsy class names", () => {
    assert.equal(cn("a", false, null, undefined, "b"), "a b");
  });

  test("formatDate renders in UTC, so a trip date never shifts by a day", () => {
    assert.equal(formatDate("2026-09-10"), "Thu, Sep 10");
  });

  test("relativeDate labels today", () => {
    assert.equal(relativeDate(new Date().toISOString()), "Today");
  });
});
