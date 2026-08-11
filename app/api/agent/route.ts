import { retrieve, groqChat, SYSTEM_RULES, ChatMessage } from "@/lib/rag";
import { assessWasteHeat, geothermalAt, scoreSite, haversineKm } from "@/lib/model";
import { heatDemandAt } from "@/lib/places";
import snapshot from "@/data/datacenters.json";

export const maxDuration = 60;

// Multi-step agent: plan -> run tools -> retrieve knowledge -> synthesize -> critic pass.
// Streams progress as NDJSON lines: {step, label, detail} then {done, report, sources}.

type Body = {
  mode: "assess" | "site";
  lat: number;
  lng: number;
  itPowerMW?: number;
  pue?: number;
  name?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        emit({ step: 1, label: "Planning", detail: `Mode: ${body.mode}. Deciding which tools to run.` });

        // Tool 1: geothermal lookup (thesis grid)
        const geo = geothermalAt(body.lat, body.lng, "ssp585");
        emit({
          step: 2,
          label: "Tool: geothermal grid",
          detail: geo.extractionWm !== null
            ? `Sustainable extraction at point: ${geo.extractionWm} W/m (SSP 5-8.5)`
            : "Point outside Germany grid",
        });

        // Tool 2: nearest data centre from snapshot
        const items = (snapshot as { items: { name: string; lat: number; lng: number }[] }).items;
        let nearest: { name: string; km: number } | null = null;
        for (const d of items) {
          const km = haversineKm(body.lat, body.lng, d.lat, d.lng);
          if (km > 0.05 && (!nearest || km < nearest.km)) nearest = { name: d.name, km };
        }
        emit({
          step: 3,
          label: "Tool: data-centre snapshot",
          detail: nearest ? `Nearest facility: ${nearest.name} (${nearest.km.toFixed(1)} km)` : "None found",
        });

        // Tool 3: heat-demand proxy (bundled GeoNames population data)
        const demand = heatDemandAt(body.lat, body.lng);
        emit({
          step: 4,
          label: "Tool: heat-demand proxy",
          detail: `~${demand.populationWithin5km.toLocaleString()} people within 5 km` +
            (demand.nearestTown ? ` (nearest: ${demand.nearestTown.name}, ${demand.nearestTown.distanceKm} km)` : ""),
        });

        // Compute numbers
        let numbers: Record<string, unknown>;
        if (body.mode === "assess") {
          const a = assessWasteHeat(body.itPowerMW || 10, body.pue);
          numbers = { facility: body.name || "Selected data centre", location: { lat: body.lat, lng: body.lng }, ...a, geothermalAtSite: geo, nearestOtherDC: nearest, heatDemand: demand };
        } else {
          const s = scoreSite({
            lat: body.lat,
            lng: body.lng,
            geothermal: geo,
            populationWithin5km: demand.populationWithin5km,
            nearestTownName: demand.nearestTown?.name ?? null,
            nearestDataCentreKm: nearest?.km ?? null,
          });
          numbers = { location: { lat: body.lat, lng: body.lng }, sitingScore: s, geothermal: geo, nearestDC: nearest };
        }
        emit({ step: 5, label: "Computing", detail: "Heat balance and EnEfG figures computed." });

        // Retrieval
        const query = body.mode === "assess"
          ? "waste heat reuse EnEfG ERF PUE district heating homes heat pump"
          : "siting geothermal subsurface heat demand EnEfG grid fibre";
        const chunks = retrieve(query, 6);
        emit({ step: 6, label: "Retrieving knowledge", detail: `Grounding in ${chunks.length} sources: ${chunks.map((c) => c.id).join(", ")}` });

        // Synthesize
        const context = chunks.map((c) => `[${c.id}] ${c.text}`).join("\n\n");
        const draft = await groqChat(
          [
            { role: "system", content: SYSTEM_RULES },
            { role: "user", content: `CONTEXT:\n${context}\n\nNUMBERS:\n${JSON.stringify(numbers, null, 2)}\n\nTASK: Write the ${body.mode === "assess" ? "waste-heat reuse assessment" : "siting assessment"} report. Max ~350 words.` },
          ],
          900
        );
        emit({ step: 7, label: "Drafting report", detail: "Draft written by Llama 3.3 via Groq." });

        // Critic pass
        const critic = await groqChat(
          [
            { role: "system", content: "You are a strict reviewer. Check the DRAFT against the NUMBERS and CONTEXT. Fix any unsupported figure or claim. Return only the corrected final report, no commentary." } as ChatMessage,
            { role: "user", content: `CONTEXT:\n${context}\n\nNUMBERS:\n${JSON.stringify(numbers)}\n\nDRAFT:\n${draft}` },
          ],
          900
        );
        emit({ step: 8, label: "Critic review", detail: "Draft checked against numbers and sources." });

        emit({ done: true, report: critic, sources: chunks.map((c) => c.id), numbers });
      } catch (e) {
        emit({ error: e instanceof Error ? e.message : "Agent failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
