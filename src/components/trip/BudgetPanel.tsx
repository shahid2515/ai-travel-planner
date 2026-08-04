import type { GeneratedTrip } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

// Brightened for the dark theme: the light-theme values disappeared against
// a near-black background.
const COLORS: Record<string, string> = {
  accommodation: "#3ad9a5",
  food: "#e2955c",
  activities: "#5aa9d6",
  transport: "#a48ce0",
  shopping: "#d8c05a",
  misc: "#68807a",
};

const LABELS: Record<string, string> = {
  accommodation: "Stay",
  food: "Food",
  activities: "Activities",
  transport: "Transport",
  shopping: "Shopping",
  misc: "Other",
};

export default function BudgetPanel({
  budget,
  currency,
  travelers,
  askedFor,
}: {
  budget: GeneratedTrip["budget"];
  currency: string;
  travelers: number;
  askedFor: number;
}) {
  const total = budget.total || budget.breakdown.reduce((s, b) => s + b.amount, 0) || 1;
  const over = budget.total > askedFor * 1.02;

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Estimated cost
          </h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatMoney(budget.total, currency)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatMoney(budget.perPerson, currency)} each · {travelers}{" "}
            {travelers === 1 ? "traveller" : "travellers"} · flights not included
          </p>
        </div>

        <div
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            over ? "bg-ember-wash text-ember" : "bg-brand-wash text-brand"
          }`}
        >
          {over
            ? `${formatMoney(budget.total - askedFor, currency)} over budget`
            : `Within your ${formatMoney(askedFor, currency)} budget`}
        </div>
      </div>

      <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-sunk">
        {budget.breakdown.map((b) => (
          <div
            key={b.category}
            title={`${LABELS[b.category] ?? b.category}: ${formatMoney(b.amount, currency)}`}
            style={{
              width: `${(b.amount / total) * 100}%`,
              backgroundColor: COLORS[b.category] ?? COLORS.misc,
            }}
          />
        ))}
      </div>

      <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {budget.breakdown.map((b) => (
          <li key={b.category} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS[b.category] ?? COLORS.misc }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{LABELS[b.category] ?? b.category}</span>
                <span className="text-sm tabular-nums">{formatMoney(b.amount, currency)}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted">{b.note}</p>
            </div>
          </li>
        ))}
      </ul>

      {budget.verdict && (
        <p className="mt-6 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
          {budget.verdict}
        </p>
      )}
    </section>
  );
}
