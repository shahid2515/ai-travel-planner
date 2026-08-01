"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { placeId: string; label: string; main: string; secondary: string };

const POPULAR = ["Lisbon, Portugal", "Tokyo, Japan", "Marrakech, Morocco", "Mexico City, Mexico"];

export default function DestinationField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string, placeId?: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  // Debounced lookup. Returns nothing when no Google key is configured,
  // in which case the field simply behaves as a plain text input.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (value.trim().length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(json.suggestions ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline — leave the last suggestions in place */
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  // Derived rather than cleared in the effect — one render instead of two.
  const visible = value.trim().length >= 2 ? suggestions : [];

  const pick = (s: Suggestion) => {
    skipNextFetch.current = true;
    onChange(s.label, s.placeId);
    setOpen(false);
    setSuggestions([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !visible.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + visible.length) % visible.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(visible[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <label className="label" htmlFor="destination">
        Where to?
      </label>
      <input
        id="destination"
        name="destination"
        className="field text-lg"
        placeholder="Lisbon, Portugal"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && visible.length > 0 && (
        <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5">
          {visible.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`flex w-full items-baseline gap-2 px-4 py-2.5 text-left text-sm ${
                  i === active ? "bg-brand-wash" : "hover:bg-sunk"
                }`}
              >
                <span className="font-medium">{s.main}</span>
                <span className="text-muted">{s.secondary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!value && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {POPULAR.map((city) => (
            <button
              key={city}
              type="button"
              className="chip"
              onClick={() => {
                skipNextFetch.current = true;
                onChange(city);
              }}
            >
              {city.split(",")[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
