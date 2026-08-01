import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid w-full max-w-6xl place-items-center px-5 py-28 text-center">
      <div className="max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">That trip is not here</h1>
        <p className="mt-3 text-ink-soft">
          It may have been deleted, or the link belongs to a different browser session.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Plan a trip
          </Link>
          <Link href="/trips" className="btn btn-ghost">
            Saved trips
          </Link>
        </div>
      </div>
    </div>
  );
}
