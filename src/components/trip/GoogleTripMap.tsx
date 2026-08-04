"use client";

import { useEffect, useState } from "react";
import { APIProvider, AdvancedMarker, InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import type { MapStop } from "@/lib/trip-utils";

const MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
// Google's public demo Map ID enables Advanced Markers while developing.
// Set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID for your own styling and no watermark.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || stops.length === 0) return;

    if (stops.length === 1) {
      map.setCenter({ lat: stops[0].lat, lng: stops[0].lng });
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 64);
  }, [map, stops]);

  return null;
}

/** Pans to whichever stop the timeline selected, keeping the current zoom. */
function PanToFocused({ stops, focusedKey }: { stops: MapStop[]; focusedKey: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focusedKey) return;
    const stop = stops.find((s) => s.key === focusedKey);
    if (stop) map.panTo({ lat: stop.lat, lng: stop.lng });
  }, [map, stops, focusedKey]);

  return null;
}

export default function GoogleTripMap({
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
  const [open, setOpen] = useState<MapStop | null>(null);

  return (
    <APIProvider apiKey={MAP_KEY}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
      >
        <FitBounds stops={stops} />
        <PanToFocused stops={stops} focusedKey={focusedKey} />

        {stops.map((stop) => {
          const isFocused = focusedKey === stop.key;
          return (
            <AdvancedMarker
              key={stop.key}
              position={{ lat: stop.lat, lng: stop.lng }}
              onClick={() => {
                setOpen(stop);
                onSelect?.(stop.key);
              }}
              title={stop.name}
              zIndex={isFocused ? 1000 : undefined}
            >
              <span
                className={`grid place-items-center rounded-full border-2 border-[#0a0d0c] font-bold text-[#06100c] transition-all ${
                  isFocused
                    ? "h-9 min-w-9 px-2 text-sm shadow-lg bg-white text-[#06100c]"
                    : `h-7 min-w-7 px-1.5 text-xs shadow-md ${
                        stop.kind === "restaurant" ? "bg-[#e2955c]" : "bg-[#3ad9a5]"
                      }`
                }`}
              >
                {stop.label || (stop.kind === "restaurant" ? "▲" : "●")}
              </span>
            </AdvancedMarker>
          );
        })}

        {open && (
          <InfoWindow
            position={{ lat: open.lat, lng: open.lng }}
            onCloseClick={() => setOpen(null)}
            headerContent={<strong className="text-sm">{open.name}</strong>}
          >
            <div className="pr-1 text-xs text-[#3c4c48]">
              {open.time
                ? `From ${open.time}`
                : open.kind === "restaurant"
                  ? "Restaurant"
                  : "Place to visit"}
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
