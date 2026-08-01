"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Looking up the destination",
  "Reading the brief and the budget",
  "Choosing places worth your time",
  "Picking restaurants across price ranges",
  "Ordering the days so you are not criss-crossing the city",
  // Provider-neutral: this is a client component and the place provider is
  // chosen by a server-only key, so it cannot name the service here.
  "Checking every venue against a real place database",
  "Costing it out",
];

export default function GeneratingOverlay({ destination }: { destination: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ground/92 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-3">Building your trip</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {destination || "Your destination"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          This takes 20–40 seconds. Two API round trips and a lot of cross-checking.
        </p>

        <ul className="mt-7 space-y-2.5">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 text-sm transition-opacity ${
                  done || current ? "opacity-100" : "opacity-35"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                    done
                      ? "border-brand bg-brand text-white"
                      : current
                        ? "border-brand text-brand"
                        : "border-line-strong text-muted"
                  }`}
                >
                  {done ? "✓" : current ? <span className="h-1.5 w-1.5 rounded-full bg-brand" /> : ""}
                </span>
                <span className={current ? "font-medium text-ink" : "text-ink-soft"}>{label}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-sunk">
          <div
            className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 92}%` }}
          />
        </div>
      </div>
    </div>
  );
}
