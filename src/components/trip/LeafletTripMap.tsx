"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapStop } from "@/lib/trip-utils";

/**
 * The keyless map: Leaflet rendering CARTO's basemap of OpenStreetMap data.
 * No API key, no billing account, no usage cap to worry about at demo scale.
 *
 * Pins use divIcon rather than image markers — that matches the app's styling
 * and sidesteps Leaflet's well-known broken-marker-image problem under
 * bundlers.
 */

function pin(stop: MapStop, focused: boolean) {
  const colour = focused ? "#10201c" : stop.kind === "restaurant" ? "#b4622c" : "#0f6f5c";
  const label = stop.label || (stop.kind === "restaurant" ? "&#9650;" : "&#9679;");
  const size = focused ? 34 : 26;

  return L.divIcon({
    className: "", // drop Leaflet's default white square
    html: `<span style="
      display:grid;place-items:center;
      min-width:${size}px;height:${size}px;padding:0 6px;
      border-radius:999px;border:2px solid #fff;
      background:${colour};color:#fff;
      font:700 ${focused ? 15 : 12}px/1 ui-sans-serif,system-ui,sans-serif;
      box-shadow:0 ${focused ? 3 : 1}px ${focused ? 10 : 4}px rgba(0,0,0,.35);
      transition:all .15s ease;
    ">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (!stops.length) return;

    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 15);
      return;
    }

    map.fitBounds(
      stops.map((s) => [s.lat, s.lng] as [number, number]),
      { padding: [48, 48], maxZoom: 16 },
    );
  }, [map, stops]);

  return null;
}

/** Pans to whichever stop the timeline selected, without changing zoom. */
function PanToFocused({ stops, focusedKey }: { stops: MapStop[]; focusedKey: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focusedKey) return;
    const stop = stops.find((s) => s.key === focusedKey);
    if (!stop) return;
    map.panTo([stop.lat, stop.lng], { animate: true });
  }, [map, stops, focusedKey]);

  return null;
}

export default function LeafletTripMap({
  stops,
  center,
  focusedKey = null,
  onSelect,
}: {
  stops: MapStop[];
  center: { lat: number; lng: number };
  focusedKey?: string | null;
  onSelect?: (key: string | null) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      <FitBounds stops={stops} />
      <PanToFocused stops={stops} focusedKey={focusedKey} />

      {stops.map((stop) => (
        <Marker
          key={stop.key + (focusedKey === stop.key ? "-on" : "")}
          position={[stop.lat, stop.lng]}
          icon={pin(stop, focusedKey === stop.key)}
          zIndexOffset={focusedKey === stop.key ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(stop.key) }}
        >
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            <span style={{ color: "#3c4c48" }}>
              {stop.time
                ? `From ${stop.time}`
                : stop.kind === "restaurant"
                  ? "Restaurant"
                  : "Place to visit"}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
