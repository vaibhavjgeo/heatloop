"use client";

import { useEffect, useRef } from "react";

// Leaflet loaded from CDN (script injected once); SSR-safe client component.
declare global {
  interface Window {
    L?: any;
  }
}

export interface DcMarker {
  id: string;
  name: string;
  operator?: string | null;
  lat: number;
  lng: number;
  itPowerMW?: number | null;
}

interface Props {
  markers?: DcMarker[];
  selectedId?: string | null;
  onMarkerClick?: (m: DcMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  clickPin?: { lat: number; lng: number } | null;
}

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      return;
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    s.crossOrigin = "";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function GermanyMap({
  markers = [],
  selectedId,
  onMarkerClick,
  onMapClick,
  clickPin,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const cbRef = useRef({ onMarkerClick, onMapClick });
  cbRef.current = { onMarkerClick, onMapClick };

  // init once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !shellRef.current || mapRef.current) return;
      const map = L.map(shellRef.current, { scrollWheelZoom: true }).setView(
        [51.1, 10.3],
        6
      );
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 18,
        }
      ).addTo(map);
      map.on("click", (e: any) => {
        cbRef.current.onMapClick?.(e.latlng.lat, e.latlng.lng);
      });
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // markers may already be set
      renderMarkers(L);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderMarkers(L: any) {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    for (const m of markers) {
      const sel = m.id === selectedId;
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: sel ? 9 : 6,
        color: sel ? "#1f4a37" : "#2d6a4f",
        weight: sel ? 3 : 1.5,
        fillColor: sel ? "#2d6a4f" : "#7fb99a",
        fillOpacity: 0.85,
      });
      marker.bindTooltip(
        `<strong>${m.name}</strong>${m.operator ? `<br/>${m.operator}` : ""}${
          m.itPowerMW ? `<br/>IT: ${m.itPowerMW} MW` : ""
        }`,
        { direction: "top", offset: [0, -6] }
      );
      marker.on("click", () => cbRef.current.onMarkerClick?.(m));
      marker.addTo(layerRef.current);
    }
  }

  // update markers when they change
  useEffect(() => {
    if (window.L && mapRef.current) renderMarkers(window.L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, selectedId]);

  // click pin
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    if (pinRef.current) {
      mapRef.current.removeLayer(pinRef.current);
      pinRef.current = null;
    }
    if (clickPin) {
      pinRef.current = L.marker([clickPin.lat, clickPin.lng]).addTo(mapRef.current);
    }
  }, [clickPin]);

  return <div className="map-shell" ref={shellRef} />;
}
