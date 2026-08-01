import { ImageResponse } from "next/og";

/**
 * Social preview card.
 *
 * Without this, pasting the link into Upwork, WhatsApp or LinkedIn produces a
 * bare URL with no image — which is a poor first impression for something whose
 * whole job is to look considered. Generated at request time rather than shipped
 * as a PNG so the wording stays in sync with the code.
 */

export const alt = "Wayfare — AI travel planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#10201c",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#0f6f5c",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            W
          </div>
          <div style={{ color: "white", fontSize: 30, fontWeight: 600 }}>Wayfare</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "white",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            A whole trip, costed and mapped, in about thirty seconds.
          </div>
          <div style={{ color: "#9fb3ad", fontSize: 30, maxWidth: 880, lineHeight: 1.35 }}>
            Every venue re-checked against a real place database, so invented places never
            reach the map.
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, color: "#6b8079", fontSize: 24 }}>
          <div style={{ display: "flex" }}>Next.js</div>
          <div style={{ display: "flex" }}>Structured Outputs</div>
          <div style={{ display: "flex" }}>OpenStreetMap</div>
          <div style={{ display: "flex" }}>Postgres</div>
        </div>
      </div>
    ),
    size,
  );
}
