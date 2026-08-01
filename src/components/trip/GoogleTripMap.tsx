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

export default function GoogleTripMap({
  stops,
  center,
}: {
  stops: MapStop[];
  center: { lat: number; lng: number };
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

        {stops.map((stop) => (
          <AdvancedMarker
            key={stop.key}
            position={{ lat: stop.lat, lng: stop.lng }}
            onClick={() => setOpen(stop)}
            title={stop.name}
          >
            <span
              className={`grid h-7 min-w-7 place-items-center rounded-full border-2 border-white px-1.5 text-xs font-bold text-white shadow-md ${
                stop.kind === "restaurant" ? "bg-[#b4622c]" : "bg-[#0f6f5c]"
              }`}
            >
              {stop.label || (stop.kind === "restaurant" ? "▲" : "●")}
            </span>
          </AdvancedMarker>
        ))}

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
