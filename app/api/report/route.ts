import { NextResponse } from "next/server";
import { retrieve, groqChat, SYSTEM_RULES } from "@/lib/rag";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { mode, numbers, question } = (await req.json()) as {
      mode: "assess" | "site";
      numbers: Record<string, unknown>;
      question?: string;
    };
    const query =
      question ||
      (mode === "assess"
        ? "data centre waste heat reuse EnEfG energy reuse factor district heating homes heat pump PUE"
        : "data centre siting geothermal subsurface heat demand district heating EnEfG grid");
    const chunks = retrieve(query, 6);
    const context = chunks
      .map((c) => `[${c.id}] ${c.text}`)
      .join("\n\n");
    const task =
      mode === "assess"
        ? "Write a short waste-heat reuse assessment for this existing data centre: what the numbers mean, how it stands against the EnEfG ERF targets, and 2-3 concrete reuse options."
        : "Write a short siting assessment for a new data centre at this location: interpret the score components and give 2-3 concrete recommendations.";
    const text = await groqChat(
      [
        { role: "system", content: SYSTEM_RULES },
        {
          role: "user",
          content: `CONTEXT:\n${context}\n\nNUMBERS:\n${JSON.stringify(numbers, null, 2)}\n\nTASK: ${task}`,
        },
      ],
      900
    );
    return NextResponse.json({ report: text, sources: chunks.map((c) => c.id) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
