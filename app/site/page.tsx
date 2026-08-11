import SiteTool from "@/components/SiteTool";

export default function SitePage() {
  return (
    <main>
      <section className="hero" style={{ paddingBottom: 20 }}>
        <div className="eyebrow wrap">Use case 02 · New sites · Subsurface × heat demand</div>
        <div className="wrap">
          <h1 className="display">Where should the <em>next</em> data centre go?</h1>
          <p className="lead">Click anywhere in Germany - scored on subsurface potential, heat demand, and infrastructure synergy.</p>
        </div>
      </section>
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap"><SiteTool /></div>
      </section>
    </main>
  );
}
