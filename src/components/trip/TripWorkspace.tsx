"use client";

import { useMemo, useRef, useState } from "react";
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
  const [focused, setFocused] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const day = payload.trip.days[dayIndex];
  const currency = payload.input.currency;

  const dayStops = useMemo(() => stopsForDay(payload, dayIndex), [payload, dayIndex]);
  const stops = useMemo(
    () => (showAll ? allStops(payload) : dayStops),
    [payload, dayStops, showAll],
  );
  const center = useMemo(() => mapCenter(payload, stops), [payload, stops]);

  // Lets the timeline show the same number the map pin shows.
  const stopByActivity = useMemo(
    () => new Map(dayStops.map((s) => [s.activityIndex, s])),
    [dayStops],
  );

  /** Arrow-key navigation is what makes a tablist usable without a mouse. */
  function onTabKeyDown(e: React.KeyboardEvent, i: number) {
    const last = payload.trip.days.length - 1;
    const go = (next: number) => {
      e.preventDefault();
      setDayIndex(next);
      setFocused(null);
      tabRefs.current[next]?.focus();
    };
    if (e.key === "ArrowRight") go(i === last ? 0 : i + 1);
    else if (e.key === "ArrowLeft") go(i === 0 ? last : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(last);
  }

  if (!day) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Day by day</h2>
          <p className="mt-1 text-sm text-muted">
            Numbers on the map match the numbered stops below. Select one to find it.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAll((s) => !s);
            setFocused(null);
          }}
          aria-pressed={showAll}
          className={`chip ${showAll ? "chip-on" : ""}`}
        >
          {showAll ? "Showing everything" : "Show every place on the map"}
        </button>
      </div>

      {/* Day switcher — a real tablist, so arrow keys and screen readers work */}
      <div className="mt-6 -mx-5 overflow-x-auto px-5 pb-1">
        <div role="tablist" aria-label="Trip days" className="flex gap-2">
          {payload.trip.days.map((d, i) => {
            const selected = i === dayIndex;
            return (
              <button
                key={d.day}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`day-tab-${i}`}
                aria-selected={selected}
                aria-controls={`day-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                onClick={() => {
                  setDayIndex(i);
                  setFocused(null);
                }}
                className={`shrink-0 rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-brand bg-brand-wash"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <span className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                  {payload.dates[i] ? formatDate(payload.dates[i]) : `Day ${d.day}`}
                </span>
                <span
                  className={`mt-0.5 block max-w-[210px] truncate text-sm font-semibold ${
                    selected ? "text-brand" : ""
                  }`}
                  title={d.title}
                >
                  {d.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div
          role="tabpanel"
          id={`day-panel-${dayIndex}`}
          aria-labelledby={`day-tab-${dayIndex}`}
          className="card p-6 sm:p-7"
        >
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

          <ol className="mt-6">
            {day.activities.map((activity, i) => {
              const style = TYPE_STYLE[activity.type] ?? TYPE_STYLE.experience;
              const match = findByName(payload, activity.placeName);
              const stop = stopByActivity.get(i);
              const isFocused = stop != null && focused === stop.key;
              const last = i === day.activities.length - 1;

              return (
                <li key={`${activity.time}-${i}`} className="relative flex gap-4 pb-6">
                  {!last && (
                    <span aria-hidden className="absolute left-[13px] top-7 h-full w-px bg-line" />
                  )}

                  {/* Numbered when the stop is on the map, plain dot otherwise */}
                  {stop ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAll(false);
                        setFocused(isFocused ? null : stop.key);
                      }}
                      aria-pressed={isFocused}
                      title={`Find ${stop.name} on the map`}
                      className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition ${
                        isFocused
                          ? "scale-110 border-ink bg-ink text-white"
                          : stop.kind === "restaurant"
                            ? "border-ember bg-ember text-white hover:scale-110"
                            : "border-brand bg-brand text-white hover:scale-110"
                      }`}
                    >
                      {stop.label}
                    </button>
                  ) : (
                    <span
                      aria-hidden
                      className={`relative z-10 mt-2.5 ml-2 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-surface ${style.dot}`}
                    />
                  )}

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

        <div className="lg:sticky lg:top-24">
          <TripMap
            stops={stops}
            center={center}
            focusedKey={focused}
            onSelect={setFocused}
            className="h-[420px] lg:h-[560px]"
          />
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
