import AssessTool from "@/components/AssessTool";

export default function AssessPage() {
  return (
    <main>
      <section className="hero" style={{ paddingBottom: 20 }}>
        <div className="wrap">
          <div className="eyebrow">Use case 01 · Existing facilities · EnEfG compliance</div>
          <h1 className="display">How much heat does this data centre <em>waste</em>?</h1>
          <p className="lead">Pick a facility on the map or enter an IT load - typical colocation halls run 2-20 MW, hyperscale campuses 30-100+ MW.</p>
        </div>
      </section>
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap"><AssessTool /></div>
      </section>
    </main>
  );
}
