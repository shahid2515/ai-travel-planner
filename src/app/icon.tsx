import { ImageResponse } from "next/og";

/**
 * Favicon, generated from the same mark as the header logo rather than left as
 * create-next-app's default. Browser tabs and bookmarks are the cheapest place
 * a project looks unfinished.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f6f5c",
          color: "white",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "sans-serif",
          borderRadius: 7,
        }}
      >
        W
      </div>
    ),
    size,
  );
}
