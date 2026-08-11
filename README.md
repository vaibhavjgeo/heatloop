# HeatLoop - Data-Centre Waste Heat × Geothermal Siting for Germany

> Every data centre is a power plant for heat. HeatLoop shows where that heat should go: assess real German facilities against the EnEfG reuse targets, and score new sites by subsurface and heat-demand potential - with a multi-step AI agent explaining every verdict.

**Live**: [vaibhavjgeo-heatloop.vercel.app](https://vaibhavjgeo-heatloop.vercel.app)

## Why this exists

Germany's Energy Efficiency Act (EnEfG) requires new data centres to reuse **10% of their waste heat from July 2026, 15% from 2027, and 20% from 2028** - making heat off-take a legal siting criterion, not just an economic one. German data centres consumed about 20 TWh in 2024 (~21.3 TWh expected 2025, Bitkom/Borderstep) and vent most of it. HeatLoop turns that policy problem into an explorable tool built entirely on open data.

## The two use cases

**01 - Assess an existing data centre** (`/assess`): pick any of 270+ real German facilities (OpenStreetMap) or enter an IT load. Get continuous waste-heat output, homes-heatable equivalent, the EnEfG 10/15/20% targets in absolute GWh and homes, and an AI-written reuse assessment grounded in the law.

**02 - Score a new site** (`/site`): click anywhere in Germany. The point is scored 0-100 on three axes: subsurface thermal potential (published climate-geothermal model from my M.Sc. thesis - 5 km analysis grid resampled from ~25 km NEX-GDDP-CMIP6, SSP 5-8.5), population within 5 km as heat-demand proxy (GeoNames), and infrastructure synergy (proximity to existing facilities). A multi-step agent then explains the verdict.

## How this was built - AI-pair-programming disclosure

Built with **AI-assisted development** (Anthropic Claude as primary pair-programmer). Mine: the concept, the heat-balance and scoring model design, the EnEfG research, the thesis data, and review of the result. AI accelerated the Next.js implementation, the agent orchestration, and testing.

## Architecture

```
Next.js 14 (App Router, TypeScript) - React frontend, warm-paper design system
├── /            landing
├── /assess      use case 01 (map + calculator + agent)
├── /site        use case 02 (click-to-score + agent)
└── /api (Node.js serverless)
    ├── datacenters   OSM snapshot (271 facilities) + optional ?live=1 Overpass refresh
    ├── geothermal    per-point lookup in bundled thesis grid (5 km, CMIP6 SSP scenarios)
    ├── nearby        heat-demand proxy from bundled GeoNames population data
    ├── report        RAG report: BM25 retrieval over knowledge base -> Groq (Llama 3.3 70B)
    └── agent         multi-step agent (NDJSON stream): plan -> 3 tools -> compute ->
                      retrieve -> draft -> critic review -> final report
```

**RAG without a vector database**: retrieval is lexical BM25 over a curated knowledge base (`data/knowledge.json`: EnEfG provisions, VDI 4640 values, thesis findings, heat-reuse engineering facts). Deterministic, zero-cost, fully inspectable - every report cites its chunk IDs.

**The agent** streams its reasoning: planning, three real tool calls (thesis geothermal grid, facility snapshot with haversine nearest-neighbour, population proxy), deterministic computation, retrieval, an LLM draft, and a critic pass that checks the draft against the numbers before release.

## Data sources (all free)

| Data | Source | Shipped as |
|---|---|---|
| Data-centre locations | OpenStreetMap (Overpass API) | bundled snapshot + live refresh |
| Geothermal potential | Jaiswal (2025), KIT - doi:10.5281/zenodo.20540260 | bundled 5 km analysis grid, resampled from native ~25 km (SSP 2-4.5 / 5-8.5) |
| Heat-demand proxy | GeoNames.org (CC-BY 4.0) | bundled DE places >= 1,000 pop |
| Regulation & physics | EnEfG, VDI 4640, engineering references | curated knowledge base |
| AI model | Groq free tier (Llama 3.3 70B) | `GROQ_API_KEY` env var |

## Model constants (documented, adjustable in `lib/model.ts`)

Heat capture 85% of IT load · network losses 12% · 15,000 kWh/yr space heating per average home · default PUE 1.3 · siting weights: subsurface 40, heat demand 40, synergy 20.

## Environment variables

| Name | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq API key for report/agent generation (free at console.groq.com; never committed) |

## Run locally

```bash
npm install
GROQ_API_KEY=your_key npm run dev
# open http://localhost:3000
```

Everything except the AI report works without the key.

## Disclaimer

First-pass planning estimates on open data, not engineering advice. Facility locations are community-mapped; power ratings are user inputs. Subsurface values are 5 km model output, not site investigations.

## License

MIT. Data sources retain their own licenses (ODbL for OSM, CC-BY for GeoNames).

## Contact

Vaibhav Jaiswal · vaibhavjaiswal1234@gmail.com · [vaibhavjgeo.vercel.app](https://vaibhavjgeo.vercel.app)
