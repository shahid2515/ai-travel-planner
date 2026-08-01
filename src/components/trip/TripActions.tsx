"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TripActions({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function copyLink() {
    // The Clipboard API rejects on denied permission and is absent entirely
    // outside secure contexts. Without this the button would silently do
    // nothing and throw into the console.
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/trips");
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    // no-print: these controls are meaningless on paper
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="btn btn-ghost text-sm">
        {copied === "done"
          ? "Link copied"
          : copied === "failed"
            ? "Copy from the address bar"
            : "Copy link"}
      </button>
      <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
        Print / PDF
      </button>
      {confirming ? (
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="btn text-sm border border-ember/40 bg-ember-wash text-ember"
        >
          {deleting ? "Deleting…" : "Tap again to delete"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-ghost text-sm"
        >
          Delete
        </button>
      )}
    </div>
  );
}
