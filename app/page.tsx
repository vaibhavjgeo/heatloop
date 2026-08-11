"use client";

import { useRef, useState } from "react";
import AssessTool from "@/components/AssessTool";
import SiteTool from "@/components/SiteTool";

export default function Home() {
  const [mode, setMode] = useState<"assess" | "site">("assess");
  const toolRef = useRef<HTMLDivElement>(null);

  function open(m: "assess" | "site") {
    setMode(m);
    setTimeout(() => toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">Germany · Data Centres · Waste Heat · Shallow Geothermal · EnEfG</div>
          <h1 className="display">
            Every data centre is a <em>power plant for heat</em>. HeatLoop shows where that heat should go.
          </h1>
          <p className="lead">
            German data centres consume ~18 TWh of electricity a year and vent most of it as heat, while the
            Energy Efficiency Act (EnEfG) now requires new facilities to reuse <strong>10-20%</strong> of it.
            HeatLoop connects the dots with open data: real facilities from OpenStreetMap, subsurface potential
            from published climate-geothermal research, and an AI analyst that runs the numbers - so planners can
            see the heat-reuse opportunity of any site in seconds.
          </p>
          <div className="cta-row">
            <button className={`btn ${mode === "assess" ? "" : "btn-ghost"}`} onClick={() => open("assess")}>
              Assess an existing data centre
            </button>
            <button className={`btn ${mode === "site" ? "" : "btn-ghost"}`} onClick={() => open("site")}>
              Score a new site
            </button>
          </div>
        </div>
      </section>

      {/* ============ THE TOOL (same page) ============ */}
      <section className="block" style={{ paddingTop: 8 }} ref={toolRef} id="tool">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 01</span>{mode === "assess" ? "Use case 01 · Existing facilities" : "Use case 02 · New sites"}</div>
          <h2 className="title">
            {mode === "assess"
              ? <>How much heat does this data centre <em>waste</em>?</>
              : <>Where should the <em>next</em> data centre go?</>}
          </h2>
          <p className="sub">
            {mode === "assess"
              ? "Pick a facility on the map (green dots, OpenStreetMap) or enter an IT load - typical colocation halls run 2-20 MW, hyperscale campuses 30-100+ MW. OpenStreetMap rarely records power ratings, so the MW field is yours to set."
              : "Click anywhere in Germany. The point is scored on subsurface thermal potential (published 5 km climate-geothermal model, SSP 5-8.5), population within 5 km as heat-demand proxy (GeoNames), and infrastructure synergy - then the AI agent explains the verdict."}
          </p>
          <div style={{ marginTop: 18 }}>
            {mode === "assess" ? <AssessTool /> : <SiteTool />}
          </div>
        </div>
      </section>

      {/* ============ THE SCIENCE ============ */}
      <section className="block alt">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 02</span>The Science</div>
          <h2 className="title">Why waste heat meets the <em>subsurface</em>.</h2>
          <div className="prose">
            <h3>Electricity in, heat out</h3>
            <p>
              Practically every kilowatt a server draws leaves the building as heat. A facility with a 10 MW IT
              load emits roughly <strong>10 MW of thermal power, continuously</strong> - about 87.6 GWh of heat a
              year, enough for several thousand homes. The catch is temperature: air-cooled halls deliver
              25-45 °C, direct liquid cooling 45-60 °C, while classic district heating wants 70-90 °C. Large heat
              pumps bridge that gap with a COP of 3-5 (each unit of electricity moves 3-5 units of heat), and
              modern low-temperature networks can take the heat almost directly. HeatLoop&apos;s heat balance
              assumes <strong>85% capture</strong> of the IT load and <strong>12% network losses</strong>, at
              15,000 kWh per home and year - every constant is documented and adjustable in the model.
            </p>
            <h3>The law that changed the map</h3>
            <p>
              Germany&apos;s Energy Efficiency Act (EnEfG, in force since 2024) applies to data centres from
              300 kW connected load and sets a binding <strong>Energy Reuse Factor</strong>: at least
              <strong> 10%</strong> of energy reused for facilities starting operation from July 2026,
              <strong> 15%</strong> from 2027 and <strong>20%</strong> from 2028 - plus PUE limits (1.2 for new
              builds) and 100% renewable electricity from 2027. Exemptions exist only where municipalities commit
              to heat networks or decline offered heat. In plain terms: <strong>a nearby heat sink is now a legal
              siting criterion</strong>, not a nice-to-have.
            </p>
            <h3>Where geothermal research comes in</h3>
            <p>
              The shallow subsurface can serve a data centre twice: as a <strong>heat sink</strong> (borehole
              fields absorbing waste heat and cutting chiller electricity) and as <strong>seasonal storage</strong>
              (charge heat in summer, feed district heating in winter). Ground that conducts heat well works
              better for both. HeatLoop reads that property from my M.Sc. thesis at KIT - a model coupling
              <strong> 8 CMIP6 climate models</strong> with borehole-heat-exchanger physics across Germany at 5 km
              resolution. It found sustainable extraction rates of <strong>26.97-47.39 W/m</strong> and showed
              climate warming itself boosts them 8-24% by 2100. The same per-pixel W/m values that tell you where
              extraction thrives tell you where the ground couples heat well - which is exactly what the siting
              score uses (doi:10.5281/zenodo.20540260).
            </p>
          </div>
        </div>
      </section>

      {/* ============ WORKFLOW ============ */}
      <section className="block">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 03</span>Workflow</div>
          <h2 className="title">From open data to a <em>grounded verdict</em>.</h2>
          <div className="flow-grid">
            <div className="flow-step"><span className="n">1</span><h4>Open data in</h4><p>271 German data centres (OpenStreetMap snapshot + live Overpass refresh), 7,648 towns with population (GeoNames), and the thesis geothermal grid (CMIP6 SSP 2-4.5 / 5-8.5) - all bundled, so lookups are instant and never depend on a flaky API.</p></div>
            <div className="flow-step"><span className="n">2</span><h4>Deterministic physics</h4><p>Per point or facility: heat balance (capture, losses, homes-heatable), EnEfG targets in absolute GWh and homes, and the 0-100 siting score (subsurface 40 + heat demand 40 + synergy 20). Same numbers every time - no AI involved yet.</p></div>
            <div className="flow-step"><span className="n">3</span><h4>Retrieval grounding</h4><p>A curated knowledge base (EnEfG provisions, VDI 4640 values, thesis findings, heat-pump engineering) is searched with BM25 lexical retrieval - RAG without a vector database. Every report cites the chunk IDs it used.</p></div>
            <div className="flow-step"><span className="n">4</span><h4>Agent writes, critic checks</h4><p>A multi-step agent plans, runs three real tools, drafts the report with Llama 3.3 (Groq), then a critic pass verifies every figure against the computed numbers before you see it - streaming each step live.</p></div>
          </div>
        </div>
      </section>

      {/* ============ BEHIND THE SCENES ============ */}
      <section className="block alt">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 04</span>Behind the Scenes</div>
          <h2 className="title">What the agent <em>actually does</em>.</h2>
          <div className="prose">
            <p>
              When you press &quot;AI agent report&quot;, you watch eight numbered steps stream into the dark
              terminal box - none of them cosmetic. <strong>Planning</strong> picks the tool chain for your mode.
              Three <strong>tool calls</strong> execute against real data: the geothermal grid lookup at your
              coordinates, a haversine nearest-neighbour search over the facility snapshot (grid-and-fibre proxy),
              and the population heat-demand proxy. <strong>Computing</strong> runs the deterministic heat balance
              and EnEfG figures. <strong>Retrieval</strong> selects the knowledge chunks that ground the text.
              <strong> Drafting</strong> asks the LLM for the report under strict rules - never invent a number,
              plain hyphens, say what the context does not cover. Finally the <strong>critic</strong> re-reads the
              draft against the numbers and context and returns the corrected version. If a step fails, the stream
              tells you exactly which one and why.
            </p>
          </div>
        </div>
      </section>

      {/* ============ TECH STACK ============ */}
      <section className="block">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 05</span>Tech Stack</div>
          <h2 className="title">What it <em>runs on</em>.</h2>
          <div className="stack-grid">
            <div className="stack-col"><h4>Frontend</h4>
              <span className="tagline">Next.js 14 (App Router)</span><span className="tagline">TypeScript</span><span className="tagline">React 18</span><span className="tagline">Leaflet</span><span className="tagline">Custom CSS design system</span>
            </div>
            <div className="stack-col"><h4>Backend</h4>
              <span className="tagline">Node.js serverless (Vercel)</span><span className="tagline">5 API routes</span><span className="tagline">NDJSON streaming agent</span><span className="tagline">BM25 retrieval (no vector DB)</span>
            </div>
            <div className="stack-col"><h4>AI</h4>
              <span className="tagline">Groq · Llama 3.3 70B</span><span className="tagline">RAG grounding</span><span className="tagline">Multi-step agent</span><span className="tagline">Critic self-review</span>
            </div>
            <div className="stack-col"><h4>Data</h4>
              <span className="tagline">OpenStreetMap (ODbL)</span><span className="tagline">GeoNames (CC-BY)</span><span className="tagline">CMIP6 thesis grid</span><span className="tagline">EnEfG / VDI 4640 knowledge base</span><span className="tagline">€0/month</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW THIS WAS BUILT ============ */}
      <section className="block alt">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 06</span>How This Was Built</div>
          <h2 className="title">AI-assisted, <em>human-owned</em>.</h2>
          <div className="prose">
            <p>
              HeatLoop was built with <strong>AI-assisted development</strong> - Anthropic Claude as the primary
              pair-programmer for the Next.js implementation, the agent orchestration, and testing. The concept,
              the heat-balance and scoring model design, the EnEfG research, and the underlying thesis science are
              mine, and every constant, formula, and claim was reviewed before shipping. The result is open
              source: read the code, the model constants, and the full knowledge base on
              {" "}<a href="https://github.com/vaibhavjgeo/heatloop" style={{ color: "var(--accent)", borderBottom: "1px solid var(--accent-soft)" }}>GitHub</a>.
            </p>
            <p className="hint" style={{ marginTop: 10 }}>
              Honest limits: first-pass planning estimates on open data, not engineering advice. Facility locations
              are community-mapped and power ratings are user inputs; subsurface values are 5 km model output, not
              site investigations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
