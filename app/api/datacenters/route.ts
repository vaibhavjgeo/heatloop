import { NextResponse } from "next/server";
import snapshot from "@/data/datacenters.json";

export const revalidate = 86400; // cache 1 day

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const QUERY = `[out:json][timeout:60];area["ISO3166-1"="DE"][admin_level=2]->.de;(nwr["telecom"="data_center"](area.de);nwr["building"="data_center"](area.de););out center tags;`;

function parseMW(s?: string): number | null {
  if (!s) return null;
  const m = s.toLowerCase().replace(",", ".").match(/([\d.]+)\s*(mw|kw|w)?/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  const u = m[2] || "mw";
  return u === "kw" ? v / 1000 : u === "w" ? v / 1e6 : v;
}

export async function GET(req: Request) {
  const live = new URL(req.url).searchParams.get("live") === "1";
  if (live) {
    for (const url of OVERPASS) {
      try {
        const r = await fetch(url, {
          method: "POST",
          body: "data=" + encodeURIComponent(QUERY),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          signal: AbortSignal.timeout(45000),
        });
        if (!r.ok) continue;
        const raw = (await r.json()) as { elements: any[] };
        const items = raw.elements
          .map((e) => {
            const t = e.tags || {};
            const lat = e.type === "node" ? e.lat : e.center?.lat;
            const lng = e.type === "node" ? e.lon : e.center?.lon;
            if (lat == null) return null;
            return {
              id: `${e.type}/${e.id}`,
              name: t.name || t.operator || "Unnamed data centre",
              operator: t.operator ?? null,
              lat: +lat.toFixed(5),
              lng: +lng.toFixed(5),
              itPowerMW: parseMW(t["data_center:IT_power"]),
              totalPowerMW: parseMW(t["data_center:total_power"]),
              tier: t["data_center:tier"] ?? null,
              website: t.website ?? null,
            };
          })
          .filter(Boolean);
        return NextResponse.json({
          source: "OpenStreetMap (live via Overpass)",
          count: items.length,
          items,
        });
      } catch {
        // try next mirror
      }
    }
    // fall through to snapshot on total failure
  }
  return NextResponse.json(snapshot);
}
