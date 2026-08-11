import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">
            Germany · Data Centres · Waste Heat · Shallow Geothermal · EnEfG
          </div>
          <h1 className="display">
            Every data centre is a <em>power plant for heat</em>. HeatLoop shows
            where that heat should go.
          </h1>
          <p className="lead">
            German data centres consume ~18 TWh of electricity a year and vent
            most of it as heat, while the Energy Efficiency Act (EnEfG) now
            requires new facilities to reuse <strong>10-20%</strong> of it.
            HeatLoop connects the dots with open data: real facilities from
            OpenStreetMap, subsurface potential from published climate-geothermal
            research, and an AI analyst that runs the numbers - so planners can
            see the heat-reuse opportunity of any site in seconds.
          </p>
          <div className="cta-row">
            <Link href="/assess" className="btn">Assess an existing data centre</Link>
            <Link href="/site" className="btn btn-ghost">Score a new site</Link>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="section-eyebrow"><span className="sym">§ 01</span>Two questions, two tools</div>
          <h2 className="title">What HeatLoop <em>answers</em>.</h2>
          <div className="mode-grid">
            <Link href="/assess" className="mode-card">
              <span className="num">USE CASE / 01 · EXISTING FACILITIES</span>
              <h3>How much heat does this data centre <em>waste</em> - and who could use it?</h3>
              <p>
                Pick any of 270+ real German data centres (live from
                OpenStreetMap) or enter a planned IT load. Get its continuous
                waste-heat output, how many homes that could heat, the EnEfG
                10/15/20% reuse targets in absolute numbers, and an AI-written
                reuse assessment grounded in the law.
              </p>
              <span className="arrow">→</span>
            </Link>
            <Link href="/site" className="mode-card">
              <span className="num">USE CASE / 02 · NEW SITES</span>
              <h3>Where should the <em>next</em> data centre go?</h3>
              <p>
                Click anywhere in Germany. HeatLoop scores the point on three
                axes: subsurface thermal potential (from a published 5 km
                climate-geothermal model), nearby residential heat demand
                (OpenStreetMap), and infrastructure synergy - then a multi-step
                AI agent explains the verdict.
              </p>
              <span className="arrow">→</span>
            </Link>
          </div>
          <div className="note" style={{ marginTop: 26 }}>
            <strong>Why now:</strong> the EnEfG makes waste-heat reuse a legal
            requirement for new German data centres from July 2026 (10% ERF),
            rising to 20% by 2028. Heat off-take is no longer optional - it is a
            siting criterion written into law.
          </div>
        </div>
      </section>
    </main>
  );
}
