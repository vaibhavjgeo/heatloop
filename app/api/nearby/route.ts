import { NextResponse } from "next/server";
import { heatDemandAt } from "@/lib/places";

// Heat-demand proxy from bundled GeoNames population data - deterministic, instant.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const lat = parseFloat(p.get("lat") || "");
  const lng = parseFloat(p.get("lng") || "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  return NextResponse.json({
    ...heatDemandAt(lat, lng),
    source: "GeoNames.org population data (CC-BY 4.0)",
  });
}
