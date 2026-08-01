import Link from "next/link";
import PlannerForm from "@/components/PlannerForm";
import { resolveProvider } from "@/lib/llm";
import { placesProviderLabel } from "@/lib/places";

const STEPS = [
  {
    n: "01",
    title: "Tell it the constraints",
    body: "Destination, dates, how many of you, what you can spend and how hard you want to go at it.",
  },
  {
    n: "02",
    title: "The model drafts the trip",
    body: "A structured-output call returns places, restaurants and a costed hour-by-hour plan for every day.",
  },
  {
    n: "03",
    title: "Google checks the homework",
    body: "Every venue is looked up in a real place database for photos, addresses and map pins. Anything the lookup cannot find gets no pin, so invented places never reach the map.",
  },
];

export default function Home() {
  const provider = resolveProvider();
  const places = placesProviderLabel();

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">AI travel planner</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              A whole trip, costed and mapped, in about thirty seconds.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              Give it a destination and a budget. Get back real places, real restaurants and a
              day-by-day plan that respects opening hours, travel time and what you can actually
              spend.
            </p>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-7">
              {[
                ["Budgeted", "to the category"],
                ["Verified", `against ${places}`],
                ["Saved", "for whenever you go"],
              ].map(([head, sub]) => (
                <div key={head}>
                  <dt className="text-sm font-semibold">{head}</dt>
                  <dd className="mt-0.5 text-sm text-muted">{sub}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 max-w-md rounded-xl border border-line bg-sunk px-4 py-3 text-sm text-ink-soft">
              {provider ? (
                <>
                  <strong className="font-semibold">Running on {provider.label}</strong> (
                  <code className="font-mono text-xs">{provider.model}</code>) with venue lookups
                  against {places}.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Demo mode.</strong> No model key is set, so a
                  sample Lisbon itinerary is served instead. Add{" "}
                  <code className="font-mono text-xs">GEMINI_API_KEY</code> (free, no card) to{" "}
                  <code className="font-mono text-xs">.env</code> and restart to generate real
                  trips.
                </>
              )}
            </p>
          </div>

          <div className="animate-fade-up">
            <PlannerForm />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card p-6">
              <span className="font-mono text-xs font-semibold text-brand">{step.n}</span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span>Already planned something?</span>
          <Link href="/trips" className="font-semibold text-brand hover:underline">
            Open your saved trips →
          </Link>
        </div>
      </section>
    </div>
  );
}
