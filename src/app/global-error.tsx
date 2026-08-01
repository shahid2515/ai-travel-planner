"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself, where the
 * normal error.tsx cannot render because the layout it lives inside is the
 * thing that failed. It must supply its own <html> and <body>, and cannot rely
 * on the app's fonts or CSS variables — hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f7f5",
          color: "#10201c",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem", margin: 0, letterSpacing: "-0.02em" }}>
            Wayfare hit an unexpected error
          </h1>
          <p style={{ color: "#3c4c48", lineHeight: 1.6 }}>
            The whole page failed to render rather than just one section. Reloading usually clears
            it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.7rem 1.2rem",
              borderRadius: 10,
              border: "none",
              background: "#0f6f5c",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#6b7a76" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
