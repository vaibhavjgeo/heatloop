import { NextResponse } from "next/server";
import { geothermalAt } from "@/lib/model";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const lat = parseFloat(p.get("lat") || "");
  const lng = parseFloat(p.get("lng") || "");
  const scenario = p.get("scenario") === "ssp245" ? "ssp245" : "ssp585";
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  return NextResponse.json(geothermalAt(lat, lng, scenario));
}
