"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TripActions({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="btn btn-ghost text-sm">
        {copied ? "Link copied" : "Copy link"}
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
