export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** ISO date for each day of the trip. Empty array when no start date was given. */
export function buildDates(startDate: string | undefined | null, days: number): string[] {
  if (!startDate) return [];
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return [];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount || 0));
  } catch {
    return `${Math.round(amount || 0).toLocaleString("en-US")} ${currency}`;
  }
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(d);
}

export function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(time: string) {
  const [hStr, mStr = "00"] = String(time).split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr.padStart(2, "0")} ${suffix}`;
}

export function photoSrc(photoName: string | null | undefined, width = 900) {
  if (!photoName) return null;
  // OpenStreetMap/Wikipedia photos are already public URLs; Google Places gives
  // an opaque resource name that needs the server key to resolve.
  if (photoName.startsWith("http")) return photoName;
  return `/api/photo?name=${encodeURIComponent(photoName)}&w=${width}`;
}

export function relativeDate(iso: string) {
  const then = new Date(iso).getTime();
  const diffDays = Math.round((Date.now() - then) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(then);
}
