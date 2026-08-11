"use client";

import { useState } from "react";
import { mdLite } from "@/components/md";
import GermanyMap from "@/components/GermanyMap";

interface Geo { extractionWm: number | null; extraction50Wm: number | null; insideGermanyGrid: boolean; scenario: string; }
interface Score { total: number; subsurface: number; heatDemand: number; synergy: number; verdict: string; notes: string[]; }
interface AgentStep { step?: number; label?: string; detail?: string; done?: boolean; report?: string; sources?: string[]; error?: string; }

export default function SiteTool() {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [pop5, setPop5] = useState<number | null>(null);
  const [town, setTown] = useState<string>("");
  const [score, setScore] = useState<Score | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  async function handleClick(lat: number, lng: number) {
    setPin({ lat, lng });
    setScore(null); setReport(""); setSteps([]); setErr("");
    setLoading(true);
    try {
      const [g, nb] = await Promise.all([
        fetch(`/api/geothermal?lat=${lat}&lng=${lng}`).then((r) => r.json()),
        fetch(`/api/nearby?lat=${lat}&lng=${lng}`).then((r) => r.json()),
      ]);
      setGeo(g);
      const b: number = nb.populationWithin5km ?? 0;
      setPop5(b);
      setTown(nb.nearestTown ? `${nb.nearestTown.name} · ${nb.nearestTown.distanceKm} km` : "");
      // local score mirroring lib/model.ts (kept in sync)
      const w = g.extractionWm;
      const sub = w == null ? 0 : Math.max(0, Math.min(40, ((w - 15) / 35) * 40));
      const hd = Math.max(0, Math.min(40, (b / 80000) * 40));
      const syn = 10; // refined by agent (nearest DC known server-side)
      const total = Math.round(sub + hd + syn);
      setScore({
        total,
        subsurface: Math.round(sub),
        heatDemand: Math.round(hd),
        synergy: syn,
        verdict: total >= 75 ? "strong" : total >= 55 ? "promising" : total >= 35 ? "limited" : "poor",
        notes: [],
      });
    } catch (e) {
      setErr("Could not analyse this point. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runAgent() {
    if (!pin) return;
    setRunning(true); setSteps([]); setReport(""); setErr("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "site", lat: pin.lat, lng: pin.lng }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const obj: AgentStep = JSON.parse(line);
          if (obj.error) { setErr(obj.error); continue; }
          if (obj.done) { setReport(obj.report || ""); setSources(obj.sources || []); }
          else setSteps((s) => [...s, obj]);
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Agent failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="two-col">
            <div>
              <GermanyMap onMapClick={handleClick} clickPin={pin} />
              <p className="hint" style={{ marginTop: 8 }}>Tip: try the edge of a city - heat demand nearby, land and grid still available.</p>
            </div>
            <div className="panel">
              <h3>Site <em>score</em></h3>
              {!pin && <div className="hint">Click the map to start.</div>}
              {pin && (
                <div className="hint">
                  {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  {loading && <> · <span className="spinner" />analysing…</>}
                </div>
              )}
              {score && (
                <>
                  <div className="score-big">
                    <span className="n">{score.total}</span>
                    <span className="of">/ 100</span>
                    <span className={`verdict ${score.verdict}`}>{score.verdict}</span>
                  </div>
                  <label className="f">Subsurface potential · {score.subsurface}/40</label>
                  <div className="bar"><i style={{ width: `${(score.subsurface / 40) * 100}%` }} /></div>
                  <label className="f">Nearby heat demand · {score.heatDemand}/40</label>
                  <div className="bar"><i style={{ width: `${(score.heatDemand / 40) * 100}%` }} /></div>
                  <label className="f">Infrastructure synergy · {score.synergy}/20 (baseline - agent refines)</label>
                  <div className="bar"><i style={{ width: `${(score.synergy / 20) * 100}%` }} /></div>

                  <div className="stat-grid" style={{ marginTop: 14 }}>
                    <div className="stat">
                      <div className="v">{geo?.extractionWm ?? "–"}<span className="unit">W/m</span></div>
                      <div className="l">Sustainable extraction (100 yr)</div>
                    </div>
                    <div className="stat">
                      <div className="v">{pop5 === null ? "–" : pop5.toLocaleString()}</div>
                      <div className="l">People within 5 km{town ? ` · ${town}` : ""}</div>
                    </div>
                  </div>
                  <div className="cta-row" style={{ marginTop: 10 }}>
                    <button className="btn" onClick={runAgent} disabled={running}>
                      {running ? <><span className="spinner" />Agent working…</> : "AI agent assessment"}
                    </button>
                  </div>
                </>
              )}
              {err && <div className="note warn" style={{ marginTop: 14 }}>{err}</div>}
            </div>
          </div>

          {(steps.length > 0 || report) && (
            <div style={{ marginTop: 10 }}>
              {steps.length > 0 && (
                <div className="agent-log">
                  {steps.map((s, i) => (
                    <div className="step" key={i}>
                      <span className="n">{s.step}.</span>
                      <span className="lb">{s.label}</span>
                      <span className="dt">{s.detail}</span>
                    </div>
                  ))}
                  {running && <div className="step"><span className="n">·</span><span className="lb">…</span><span className="dt">working</span></div>}
                </div>
              )}
              {report && (
                <div className="report">
                  <div dangerouslySetInnerHTML={{ __html: mdLite(report) }} />
                  <div className="src">Grounded in: {sources.join(" · ")}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
