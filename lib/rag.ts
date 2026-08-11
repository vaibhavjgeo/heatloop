// Retrieval-grounded generation without a vector database.
// Lexical BM25-style retrieval over data/knowledge.json, then Groq for generation.

import kb from "@/data/knowledge.json";

export interface Chunk {
  id: string;
  topic: string;
  text: string;
}

const CHUNKS: Chunk[] = (kb as { chunks: Chunk[] }).chunks;

const STOP = new Set(
  "the a an and or of to in for with on at by from is are be as this that it its into per each was were will can".split(" ")
);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9äöüß.%+-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// Precompute document stats (module scope = cached per lambda instance).
const docs = CHUNKS.map((c) => tokens(c.topic + " " + c.text));
const avgLen = docs.reduce((s, d) => s + d.length, 0) / docs.length;
const df = new Map<string, number>();
for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) || 0) + 1);
const N = docs.length;
const k1 = 1.4,
  b = 0.75;

export function retrieve(query: string, topK = 5): Chunk[] {
  const q = tokens(query);
  const scores = docs.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) || 0) + 1);
    let s = 0;
    for (const t of new Set(q)) {
      const f = tf.get(t) || 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
      s += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avgLen));
    }
    return { i, s };
  });
  return scores
    .filter((x) => x.s > 0)
    .sort((a, z) => z.s - a.s)
    .slice(0, topK)
    .map((x) => CHUNKS[x.i]);
}

// ---------- Groq client ----------

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function groqChat(
  messages: ChatMessage[],
  maxTokens = 1200
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it in Vercel Project Settings -> Environment Variables."
    );
  }
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Groq API error ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = (await r.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no content");
  return text;
}

export const SYSTEM_RULES = `You are HeatLoop's analyst, writing for German energy planners and data-centre operators.
Rules:
- Ground every claim in the provided CONTEXT and NUMBERS. Never invent figures.
- If the context does not cover something, say so briefly.
- Use plain hyphens, never em dashes. Use metric units.
- Be concise and structured: short paragraphs, occasional bold key figures.
- These are first-pass planning estimates, not engineering advice - say this once at the end.`;
