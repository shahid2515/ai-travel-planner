"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DestinationField from "./DestinationField";
import GeneratingOverlay from "./GeneratingOverlay";
import { CURRENCIES, INTERESTS, PACES, type TripInput } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const PACE_COPY: Record<(typeof PACES)[number], string> = {
  relaxed: "Long meals, late starts",
  balanced: "A full day with a break",
  packed: "See as much as possible",
};

export default function PlannerForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<TripInput>({
    destination: "",
    startDate: "",
    days: 4,
    travelers: 2,
    budget: 1500,
    currency: "USD",
    pace: "balanced",
    interests: ["Food & drink", "History & culture"],
    notes: "",
  });

  const set = <K extends keyof TripInput>(key: K, value: TripInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (interest: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));

  const perPersonPerDay = Math.round(form.budget / Math.max(1, form.travelers) / Math.max(1, form.days));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.destination.trim().length < 2) {
      setError("Pick a destination first.");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Try again.");
        setPending(false);
        return;
      }

      router.push(`/trips/${json.id}`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <>
      {pending && <GeneratingOverlay destination={form.destination} />}

      <form onSubmit={onSubmit} className="card p-6 shadow-sm sm:p-8">
        <DestinationField
          value={form.destination}
          onChange={(destination, placeId) => setForm((f) => ({ ...f, destination, placeId }))}
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              className="field"
              value={form.startDate ?? ""}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="days">
              Days — {form.days}
            </label>
            <input
              id="days"
              type="range"
              min={1}
              max={10}
              value={form.days}
              onChange={(e) => set("days", Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
          </div>

          <div>
            <label className="label" htmlFor="travelers">
              Travellers
            </label>
            <select
              id="travelers"
              className="field"
              value={form.travelers}
              onChange={(e) => set("travelers", Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "traveller" : "travellers"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label" htmlFor="budget">
              Budget
            </label>
            <div className="flex gap-2">
              <input
                id="budget"
                type="number"
                min={50}
                step={50}
                className="field"
                value={form.budget}
                onChange={(e) => set("budget", Number(e.target.value))}
              />
              <select
                aria-label="Currency"
                className="field w-24"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value as TripInput["currency"])}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-muted">
              {formatMoney(perPersonPerDay, form.currency)} per person per day · excludes flights
            </p>
          </div>

          <div>
            <span className="label">Pace</span>
            <div className="flex gap-1.5 rounded-xl bg-sunk p-1">
              {PACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("pace", p)}
                  title={PACE_COPY[p]}
                  className={`rounded-lg px-3.5 py-2 text-sm capitalize transition ${
                    form.pace === p
                      ? "bg-surface font-semibold text-brand shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{PACE_COPY[form.pace]}</p>
          </div>
        </div>

        <div className="mt-6">
          <span className="label">What are you into?</span>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`chip ${form.interests.includes(interest) ? "chip-on" : ""}`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="label" htmlFor="notes">
            Anything else?
          </label>
          <textarea
            id="notes"
            rows={2}
            className="field resize-none"
            placeholder="Travelling with a 4-year-old, vegetarian, no early mornings…"
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-ember/30 bg-ember-wash px-4 py-3 text-sm text-ember">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full py-3.5">
          {pending ? "Building your trip…" : "Plan my trip"}
        </button>
      </form>
    </>
  );
}
