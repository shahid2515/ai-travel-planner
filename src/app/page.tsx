import Link from "next/link";
import PlannerForm from "@/components/PlannerForm";
import { resolveProvider } from "@/lib/llm";
import { placesProviderLabel } from "@/lib/places";

/**
 * The pipeline, stated as stages rather than as a "how it works" card grid.
 *
 * The old version was three numbered boxes of equal size — the layout every
 * generated marketing page reaches for. This is the same information as a
 * spec: stage, what runs, what comes back.
 */
const STAGES = [
  {
    id: "01",
    name: "input",
    detail: "destination · dates · budget · pace · interests",
    body: "Constraints, not a chat prompt. The budget is a target the plan has to hit, not a note the model may ignore.",
  },
  {
    id: "02",
    name: "generate",
    detail: "structured outputs · strict JSON schema",
    body: "One call returns places, restaurants and a costed hour-by-hour plan for every day. The schema is enforced, so the response is always the exact shape the UI expects.",
  },
  {
    id: "03",
    name: "verify",
    detail: "every venue re-queried against a place database",
    body: "The step that matters. A model asked for restaurants will occasionally invent one. Each name is looked up for real — address, coordinates, photo. Anything not found gets no map pin.",
    emphasis: true,
  },
  {
    id: "04",
    name: "persist",
    detail: "postgres · shareable url",
    body: "The trip is saved and addressable. Open it later, print it, send the link to whoever you are travelling with.",
  },
];

export default function Home() {
  const provider = resolveProvider();
  const places = placesProviderLabel();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative border-b border-line">
        <div aria-hidden className="grid-bg absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ground"
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">AI trip planner</p>

            {/* Deliberate scale contrast: the headline is far larger than
                anything near it, which is what stops a page reading as
                uniformly generated. */}
            <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              A whole trip,
              <br />
              costed and mapped,
              <br />
              <span className="text-brand">in about thirty seconds.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Give it a destination and a budget. Get real places, real restaurants and a
              day-by-day plan that respects opening hours, travel time and what you can actually
              spend.
            </p>

            <dl className="mt-10 grid max-w-lg grid-cols-3 border-t border-line pt-6">
              {[
                ["~35s", "to a full plan"],
                ["100%", "venues verified"],
                ["10", "days maximum"],
              ].map(([figure, caption]) => (
                <div key={caption}>
                  <dt className="font-mono text-2xl font-medium text-ink">{figure}</dt>
                  <dd className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                    {caption}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 flex max-w-md items-start gap-2.5 font-mono text-[11px] leading-relaxed tracking-wide text-muted">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                {provider ? (
                  <>
                    RUNNING {provider.label.toUpperCase()} · {provider.model} · VERIFIED AGAINST{" "}
                    {places.toUpperCase()}
                  </>
                ) : (
                  <>
                    DEMO MODE · NO MODEL KEY SET · ADD GEMINI_API_KEY TO .ENV TO GENERATE REAL
                    TRIPS
                  </>
                )}
              </span>
            </p>
          </div>

          <div className="animate-fade-up lg:pt-2">
            <PlannerForm />
          </div>
        </div>
      </section>

      {/* ── What you get: show the output, don't describe it ─── */}
      <section className="border-b border-line bg-sunk">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <p className="rule">Output</p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight">
                Every stop numbered, priced, and findable.
              </h2>
              <p className="mt-5 leading-relaxed text-ink-soft">
                Each day is a timeline with real addresses and walking times between stops.
                Selecting a stop highlights it on the map, so the plan and the geography are never
                two separate things you have to reconcile.
              </p>
              <ul className="mt-7 space-y-3 font-mono text-[12px] tracking-wide text-muted">
                {[
                  "timed stops with per-person cost",
                  "walking + transit notes between them",
                  "budget split by category, against your target",
                  "restaurants priced and placed",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="text-brand-dim">→</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bleeds past the container on large screens so the section does
                not read as another neat symmetrical box. */}
            <figure className="lg:-mr-16 xl:-mr-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/product.png"
                alt="A generated Rome itinerary: numbered timeline on the left, map with matching pins on the right"
                className="w-full rounded-lg border border-line-strong"
                loading="lazy"
              />
              <figcaption className="mt-3 font-mono text-[11px] tracking-wide text-muted">
                Rome · 4 days · €2,200 · 17 of 17 venues verified
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <p className="rule">Pipeline</p>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="grid gap-4 py-7 md:grid-cols-[auto_1fr_1.4fr] md:gap-10"
            >
              <div className="flex items-baseline gap-3 md:block">
                <span
                  className={`font-mono text-sm ${stage.emphasis ? "text-brand" : "text-muted"}`}
                >
                  {stage.id}
                </span>
              </div>

              <div>
                <h3
                  className={`font-mono text-sm tracking-[0.12em] uppercase ${
                    stage.emphasis ? "text-brand" : "text-ink"
                  }`}
                >
                  {stage.name}
                </h3>
                <p className="mt-1.5 font-mono text-[11px] leading-relaxed tracking-wide text-muted">
                  {stage.detail}
                </p>
              </div>

              <p className="leading-relaxed text-ink-soft">{stage.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <p className="max-w-xl leading-relaxed text-ink-soft">
            Stage 03 is the whole argument. Generating an itinerary is easy; proving the places in
            it exist is the part that separates a tool from a chat transcript.
          </p>
          <Link
            href="/trips"
            className="font-mono text-[12px] tracking-wide text-brand hover:underline"
          >
            saved trips →
          </Link>
        </div>
      </section>
    </div>
  );
}
