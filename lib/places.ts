// Bundled population proxy for heat demand (GeoNames.org, CC-BY 4.0).
// Deterministic and instant - no runtime dependency on external APIs.
import placesData from "@/data/places_de.json";
import { haversineKm } from "@/lib/model";

interface Place { n: string; lat: number; lng: number; p: number; }
const PLACES: Place[] = (placesData as { items: Place[] }).items;

export interface HeatDemandProxy {
  populationWithin5km: number;
  nearestTown: { name: string; population: number; distanceKm: number } | null;
}

export function heatDemandAt(lat: number, lng: number): HeatDemandProxy {
  let pop = 0;
  let nearest: HeatDemandProxy["nearestTown"] = null;
  // coarse prefilter by bounding box (~0.15 deg ≈ 16 km) before haversine
  for (const pl of PLACES) {
    const dLat = Math.abs(pl.lat - lat);
    const dLng = Math.abs(pl.lng - lng);
    if (dLat > 0.2 || dLng > 0.3) continue;
    const d = haversineKm(lat, lng, pl.lat, pl.lng);
    if (d <= 5) pop += pl.p;
    if (!nearest || d < nearest.distanceKm) {
      nearest = { name: pl.n, population: pl.p, distanceKm: +d.toFixed(1) };
    }
  }
  return { populationWithin5km: pop, nearestTown: nearest };
}
