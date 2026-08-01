/** Skeleton for the saved-trips grid, matching the real card dimensions. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12" aria-busy="true" aria-label="Loading trips">
      <div className="h-9 w-52 rounded bg-sunk" />
      <div className="mt-3 h-5 w-72 rounded bg-sunk" />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card overflow-hidden">
            <div className="shimmer h-36 w-full bg-sunk" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 rounded bg-sunk" />
              <div className="h-5 w-3/4 rounded bg-sunk" />
              <div className="h-4 w-full rounded bg-sunk" />
              <div className="h-4 w-5/6 rounded bg-sunk" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
