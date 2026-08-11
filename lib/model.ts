// HeatLoop core domain model
// Waste-heat physics, EnEfG compliance, geothermal grid lookup, siting score.
// All constants documented and sourced in data/knowledge.json.

import geo245 from "@/data/geo_ssp245.json";
import geo585 from "@/data/geo_ssp585.json";

export const CONSTANTS = {
  HOURS_PER_YEAR: 8760,
  /** Average annual space-heating demand of a German dwelling (kWh/yr). */
  HOME_HEAT_KWH_YR: 15000,
  /** Typical district-heating distribution losses. */
  NETWORK_LOSS: 0.12,
  /** Default PUE for a modern facility if unknown. */
  DEFAULT_PUE: 1.3,
  /** Share of IT electrical load recoverable as useful heat (capture efficiency). */
  HEAT_CAPTURE: 0.85,
};

export type ErfTarget = { commissioned: string; erf: number };
export const ENEFG_ERF_TARGETS: ErfTarget[] = [
  { commissioned: "from 1 July 2026", erf: 0.10 },
  { commissioned: "from 1 July 2027", erf: 0.15 },
  { commissioned: "from 1 July 2028", erf: 0.20 },
];

export interface HeatAssessment {
  itPowerMW: number;
  pue: number;
  totalPowerMW: number;
  wasteHeatMW: number;
  wasteHeatGWhYr: number;
  usableHeatGWhYr: number; // after capture + network losses
  homesHeatable: number;
  erf: {
    target: number;
    commissioned: string;
    requiredGWhYr: number;
    achievableWithHomes: number; // homes needed to absorb the required reuse
  }[];
}

export function assessWasteHeat(itPowerMW: number, pue?: number): HeatAssessment {
  const p = pue && pue >= 1 ? pue : CONSTANTS.DEFAULT_PUE;
  const totalPowerMW = itPowerMW * p;
  // Essentially all IT electricity becomes heat; capture share is recoverable.
  const wasteHeatMW = itPowerMW * CONSTANTS.HEAT_CAPTURE;
  const wasteHeatGWhYr = (wasteHeatMW * CONSTANTS.HOURS_PER_YEAR) / 1000;
  const usableHeatGWhYr = wasteHeatGWhYr * (1 - CONSTANTS.NETWORK_LOSS);
  const homesHeatable = Math.round(
    (usableHeatGWhYr * 1_000_000) / CONSTANTS.HOME_HEAT_KWH_YR
  );
  const totalEnergyGWhYr = (totalPowerMW * CONSTANTS.HOURS_PER_YEAR) / 1000;
  const erf = ENEFG_ERF_TARGETS.map((t) => {
    const requiredGWhYr = totalEnergyGWhYr * t.erf;
    return {
      target: t.erf,
      commissioned: t.commissioned,
      requiredGWhYr,
      achievableWithHomes: Math.round(
        (requiredGWhYr * 1_000_000) / CONSTANTS.HOME_HEAT_KWH_YR
      ),
    };
  });
  return {
    itPowerMW,
    pue: p,
    totalPowerMW,
    wasteHeatMW,
    wasteHeatGWhYr,
    usableHeatGWhYr,
    homesHeatable,
    erf,
  };
}

// ---------- Geothermal grid lookup (thesis data, 5 km, Germany) ----------

type GeoGrid = {
  extent: { xmin: number; xmax: number; ymin: number; ymax: number };
  shape: { rows: number; cols: number };
  layers: Record<string, number[][]>;
};

const grids: Record<"ssp245" | "ssp585", GeoGrid> = {
  ssp245: geo245 as unknown as GeoGrid,
  ssp585: geo585 as unknown as GeoGrid,
};

export interface GeothermalPoint {
  scenario: "ssp245" | "ssp585";
  extractionWm: number | null; // sustainable 100yr renewable extraction rate (W/m)
  extraction50Wm: number | null;
  insideGermanyGrid: boolean;
}

export function geothermalAt(
  lat: number,
  lng: number,
  scenario: "ssp245" | "ssp585" = "ssp585"
): GeothermalPoint {
  const g = grids[scenario];
  const { xmin, xmax, ymin, ymax } = g.extent;
  const { rows, cols } = g.shape;
  if (lng < xmin || lng > xmax || lat < ymin || lat > ymax) {
    return { scenario, extractionWm: null, extraction50Wm: null, insideGermanyGrid: false };
  }
  // row 0 = north (ymax)
  const col = Math.min(
    cols - 1,
    Math.max(0, Math.floor(((lng - xmin) / (xmax - xmin)) * cols))
  );
  const row = Math.min(
    rows - 1,
    Math.max(0, Math.floor(((ymax - lat) / (ymax - ymin)) * rows))
  );
  const sustainable =
    g.layers["ql_UrbanRenew_max_100yr"]?.[row]?.[col] ?? null;
  const fifty = g.layers["ql_Urban_50yr"]?.[row]?.[col] ?? null;
  const clean = (v: number | null) =>
    v === null || Number.isNaN(v) ? null : Math.round(v * 100) / 100;
  return {
    scenario,
    extractionWm: clean(sustainable),
    extraction50Wm: clean(fifty),
    insideGermanyGrid: true,
  };
}

// ---------- Siting score ----------

export interface SitingInput {
  lat: number;
  lng: number;
  geothermal: GeothermalPoint;
  populationWithin5km: number;
  nearestTownName?: string | null;
  nearestDataCentreKm: number | null;
}

export interface SitingScore {
  total: number; // 0-100
  subsurface: number; // 0-40
  heatDemand: number; // 0-40
  synergy: number; // 0-20
  verdict: "strong" | "promising" | "limited" | "poor";
  notes: string[];
}

export function scoreSite(inp: SitingInput): SitingScore {
  const notes: string[] = [];
  // Subsurface (0-40): map extraction W/m ~ [15..50] to score.
  let subsurface = 0;
  if (inp.geothermal.extractionWm !== null) {
    const w = inp.geothermal.extractionWm;
    subsurface = Math.max(0, Math.min(40, ((w - 15) / (50 - 15)) * 40));
    notes.push(
      `Sustainable geothermal extraction at this point: ${w} W/m (thesis grid, ${inp.geothermal.scenario.toUpperCase()}). Higher values indicate ground that couples heat well - good for ground-source cooling and seasonal heat storage.`
    );
  } else {
    notes.push("Point lies outside the Germany model grid; subsurface score unavailable.");
  }
  // Heat demand (0-40): population within 5 km (GeoNames), saturating ~80,000.
  const b = inp.populationWithin5km;
  const heatDemand = Math.max(0, Math.min(40, (b / 80000) * 40));
  notes.push(
    `~${b.toLocaleString()} people live within 5 km${inp.nearestTownName ? ` (nearest town: ${inp.nearestTownName})` : ""} - the local heat sink that waste heat could serve.`
  );
  // Synergy (0-20): proximity to existing DC cluster implies power+fibre, but very close = competition; sweet spot 2-15 km.
  let synergy = 10;
  if (inp.nearestDataCentreKm !== null) {
    const d = inp.nearestDataCentreKm;
    if (d < 1) synergy = 8;
    else if (d <= 15) synergy = 20 - ((d - 1) / 14) * 6; // 20 -> 14
    else if (d <= 60) synergy = 12 - ((d - 15) / 45) * 8; // 12 -> 4
    else synergy = 4;
    notes.push(
      `Nearest existing data centre: ${d.toFixed(1)} km - a proxy for grid capacity and fibre availability in the area.`
    );
  } else {
    notes.push("No existing data centre nearby in the snapshot; grid/fibre availability unverified.");
  }
  const total = Math.round(subsurface + heatDemand + synergy);
  const verdict =
    total >= 75 ? "strong" : total >= 55 ? "promising" : total >= 35 ? "limited" : "poor";
  return {
    total,
    subsurface: Math.round(subsurface),
    heatDemand: Math.round(heatDemand),
    synergy: Math.round(synergy),
    verdict,
    notes,
  };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
