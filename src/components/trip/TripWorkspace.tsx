"use client";

import { useMemo, useState } from "react";
import TripMap from "./TripMap";
import { allStops, findByName, mapCenter, stopsForDay } from "@/lib/trip-utils";
import type { TripPayload } from "@/lib/types";
import { formatDate, formatDuration, formatMoney, formatTime } from "@/lib/utils";

const TYPE_STYLE: Record<string, { dot: string; label: string }> = {
  attraction: { dot: "bg-brand", label: "Visit" },
  meal: { dot: "bg-ember", label: "Eat" },
  experience: { dot: "bg-[#3f7f9c]", label: "Do" },
  transport: { dot: "bg-[#8d9a96]", label: "Travel" },
  "free-time": { dot: "bg-line-strong", label: "Free" },
};

export default function TripWorkspace({ payload }: { payload: TripPayload }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const day = payload.trip.days[dayIndex];
  const currency = payload.input.currency;

  const stops = useMemo(
    () => (showAll ? allStops(payload) : stopsForDay(payload, dayIndex)),
    [payload, dayIndex, showAll],
  );
  const center = useMemo(() => mapCenter(payload, stops), [payload, stops]);

  if (!day) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Day by day</h2>
          <p className="mt-1 text-sm text-muted">
            Pins on the map follow the day you have selected, in visiting order.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className={`chip ${showAll ? "chip-on" : ""}`}
        >
          {showAll ? "Showing everything" : "Show every place on the map"}
        </button>
      </div>

      {/* Day switcher */}
      <div className="mt-6 -mx-5 overflow-x-auto px-5 pb-1">
        <div className="flex gap-2">
          {payload.trip.days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setDayIndex(i)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-left transition ${
                i === dayIndex
                  ? "border-brand bg-brand-wash"
                  : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              <span className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                {payload.dates[i] ? formatDate(payload.dates[i]) : `Day ${d.day}`}
              </span>
              <span
                className={`mt-0.5 block max-w-[190px] truncate text-sm font-semibold ${
                  i === dayIndex ? "text-brand" : ""
                }`}
              >
                {d.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Timeline */}
        <div className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow">
                Day {day.day} · {day.neighborhood}
              </p>
              <h3 className="mt-1.5 text-xl font-semibold tracking-tight">{day.title}</h3>
            </div>
            <span className="rounded-lg bg-sunk px-2.5 py-1.5 text-sm font-semibold">
              ≈ {formatMoney(day.estimatedCost, currency)} pp
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{day.theme}</p>

          <ol className="mt-6 space-y-0">
            {day.activities.map((activity, i) => {
              const style = TYPE_STYLE[activity.type] ?? TYPE_STYLE.experience;
              const match = findByName(payload, activity.placeName);
              const last = i === day.activities.length - 1;

              return (
                <li key={`${activity.time}-${i}`} className="relative flex gap-4 pb-6">
                  {!last && (
                    <span
                      aria-hidden
                      className="absolute left-[7px] top-5 h-full w-px bg-line"
                    />
                  )}
                  <span
                    aria-hidden
                    className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-surface ring-1 ring-line ${style.dot}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-sm font-semibold text-brand">
                        {formatTime(activity.time)}
                      </span>
                      <h4 className="text-[15px] font-semibold leading-snug">{activity.title}</h4>
                      <span className="rounded-full bg-sunk px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {style.label}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {activity.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      {activity.durationMinutes > 0 && (
                        <span>{formatDuration(activity.durationMinutes)}</span>
                      )}
                      <span>
                        {activity.estimatedCost > 0
                          ? `${formatMoney(activity.estimatedCost, currency)} pp`
                          : "Free"}
                      </span>
                      {activity.travelNote && <span>↳ {activity.travelNote}</span>}
                    </div>

                    {match?.google && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {match.google.rating && (
                          <span className="text-ink-soft">
                            <span className="text-[#e0a53a]">★</span>{" "}
                            <span className="font-semibold">{match.google.rating.toFixed(1)}</span>
                            {match.google.reviewCount
                              ? ` (${match.google.reviewCount.toLocaleString("en-US")})`
                              : ""}
                          </span>
                        )}
                        {match.google.mapsUrl && (
                          <a
                            href={match.google.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-brand hover:underline"
                          >
                            Directions
                          </a>
                        )}
                        <span className="truncate text-muted">{match.google.address}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {day.tip && (
            <p className="rounded-xl border border-brand/25 bg-brand-wash px-4 py-3 text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-brand">Tip · </span>
              {day.tip}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="lg:sticky lg:top-24">
          <TripMap stops={stops} center={center} className="h-[420px] lg:h-[560px]" />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Places
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ember" /> Restaurants
            </span>
            <span>
              {stops.length} pin{stops.length === 1 ? "" : "s"}
              {showAll ? " across the whole trip" : ` on day ${day.day}`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
