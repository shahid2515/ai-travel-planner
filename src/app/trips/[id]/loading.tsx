/**
 * Skeleton shown while a trip is fetched.
 *
 * The trip page reads from the database, so navigation to it is not instant.
 * Without this the browser holds the previous page and then swaps abruptly,
 * which reads as a stall. Shapes match the real layout so nothing jumps.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading trip">
      <div className="border-b border-line bg-ink">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <div className="h-3 w-40 rounded bg-white/15" />
          <div className="mt-5 h-12 w-3/4 max-w-2xl rounded bg-white/20" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-white/10" />
          <div className="mt-2 h-5 w-2/3 max-w-lg rounded bg-white/10" />
          <div className="mt-9 flex gap-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-2.5 w-12 rounded bg-white/15" />
                <div className="mt-2 h-4 w-20 rounded bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-14 px-5 py-12">
        <div className="card shimmer h-52 bg-sunk" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="card shimmer h-[520px] bg-sunk" />
          <div className="card shimmer h-[420px] bg-sunk lg:h-[560px]" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card shimmer h-72 bg-sunk" />
          ))}
        </div>
      </div>
    </div>
  );
}
