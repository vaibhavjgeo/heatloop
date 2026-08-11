"use client";

import { useEffect, useMemo, useState } from "react";
import { mdLite } from "@/components/md";
import GermanyMap, { DcMarker } from "@/components/GermanyMap";

interface Assessment {
  itPowerMW: number;
  pue: number;
  totalPowerMW: number;
  wasteHeatMW: number;
  wasteHeatGWhYr: number;
  usableHeatGWhYr: number;
  homesHeatable: number;
  erf: { target: number; commissioned: string; requiredGWhYr: number; achievableWithHomes: number }[];
}

interface AgentStep { step?: number; label?: string; detail?: string; done?: boolean; report?: string; sources?: string[]; error?: string; }

export default function AssessTool() {
  const [dcs, setDcs] = useState<DcMarker[]>([]);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<DcMarker | null>(null);
  const [itMW, setItMW] = useState<string>("10");
  const [pue, setPue] = useState<string>("1.3");
  const [result, setResult] = useState<Assessment | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    fetch("/api/datacenters")
      .then((r) => r.json())
      .then((d) => {
        setDcs(d.items || []);
        setSource(d.source || "snapshot");
      })
      .catch(() => setErr("Could not load data centres."));
  }, []);

  const search = useMemo(() => dcs.slice(0, 400), [dcs]);

  function computeLocal(it: number, p: number): Assessment {
    // mirror of server model for instant feedback (kept in sync with lib/model.ts)
    const HOURS = 8760, HOME = 15000, LOSS = 0.12, CAPTURE = 0.85;
    const wasteHeatMW = it * CAPTURE;
    const wasteHeatGWhYr = (wasteHeatMW * HOURS) / 1000;
    const usableHeatGWhYr = wasteHeatGWhYr * (1 - LOSS);
    const homesHeatable = Math.round((usableHeatGWhYr * 1e6) / HOME);
    const totalEnergy = (it * p * HOURS) / 1000;
    const erf = [
      { target: 0.1, commissioned: "from 1 July 2026" },
      { target: 0.15, commissioned: "from 1 July 2027" },
      { target: 0.2, commissioned: "from 1 July 2028" },
    ].map((t) => ({
      ...t,
      requiredGWhYr: totalEnergy * t.target,
      achievableWithHomes: Math.round((totalEnergy * t.target * 1e6) / HOME),
    }));
    return { itPowerMW: it, pue: p, totalPowerMW: it * p, wasteHeatMW, wasteHeatGWhYr, usableHeatGWhYr, homesHeatable, erf };
  }

  function runNumbers() {
    setErr("");
    const it = parseFloat(itMW), p = parseFloat(pue);
    if (!it || it <= 0) { setErr("Enter the IT load in MW (e.g. 10)."); return; }
    setResult(computeLocal(it, p || 1.3));
    setReport(""); setSteps([]); setSources([]);
  }

  async function runAgent() {
    if (!result) return;
    setRunning(true); setSteps([]); setReport(""); setErr("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "assess",
          lat: selected?.lat ?? 51.1,
          lng: selected?.lng ?? 10.3,
          itPowerMW: result.itPowerMW,
          pue: result.pue,
          name: selected?.name,
        }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
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
              <GermanyMap
                markers={search}
                selectedId={selected?.id ?? null}
                onMarkerClick={(m) => { setSelected(m); if (m.itPowerMW) setItMW(String(m.itPowerMW)); }}
              />
              <p className="hint" style={{ marginTop: 8 }}>
                Facility locations: OpenStreetMap contributors (telecom=data_center). Click a green dot to select.
              </p>
            </div>

            <div className="panel">
              <h3>Configure &amp; <em>calculate</em></h3>
              <div className="hint">
                {selected ? (
                  <>Selected: <strong>{selected.name}</strong>{selected.operator ? ` · ${selected.operator}` : ""}</>
                ) : (
                  "No facility selected - numbers work standalone too."
                )}
              </div>
              <label className="f" htmlFor="it">IT load (MW)</label>
              <input id="it" className="f" inputMode="decimal" value={itMW} onChange={(e) => setItMW(e.target.value)} placeholder="e.g. 10" />
              <label className="f" htmlFor="pue">PUE (total power ÷ IT power)</label>
              <select id="pue" className="f" value={pue} onChange={(e) => setPue(e.target.value)}>
                <option value="1.2">1.2 - new build (EnEfG target from 2026)</option>
                <option value="1.3">1.3 - efficient modern facility</option>
                <option value="1.5">1.5 - existing-stock limit 2027 (~industry avg 1.56, Uptime 2024)</option>
                <option value="1.8">1.8 - older facility</option>
              </select>
              <div className="cta-row" style={{ marginTop: 18 }}>
                <button className="btn" onClick={runNumbers}>Run the numbers</button>
                <button className="btn btn-ghost" onClick={runAgent} disabled={!result || running}>
                  {running ? <><span className="spinner" />Agent working…</> : "AI agent report"}
                </button>
              </div>
              {err && <div className="note warn" style={{ marginTop: 14 }}>{err}</div>}

              {result && (
                <>
                  <div className="stat-grid" style={{ marginTop: 20 }}>
                    <div className="stat"><div className="v">{result.wasteHeatMW.toFixed(1)}<span className="unit">MW</span></div><div className="l">Continuous waste heat</div></div>
                    <div className="stat"><div className="v">{result.wasteHeatGWhYr.toFixed(0)}<span className="unit">GWh/yr</span></div><div className="l">Heat per year</div></div>
                    <div className="stat"><div className="v">{result.homesHeatable.toLocaleString()}</div><div className="l">Homes heatable*</div></div>
                    <div className="stat"><div className="v">{result.totalPowerMW.toFixed(1)}<span className="unit">MW</span></div><div className="l">Grid draw (PUE {result.pue})</div></div>
                  </div>
                  <div className="hint">*after 85% capture and 12% network losses, at 15,000 kWh/yr space-heating demand per home.</div>
                  <h3 style={{ marginTop: 20 }}>EnEfG reuse targets</h3>
                  {result.erf.map((t) => (
                    <div className="erf-row" key={t.target}>
                      <span className="k"><strong>{Math.round(t.target * 100)}%</strong> ERF · {t.commissioned}</span>
                      <span className="v">{t.requiredGWhYr.toFixed(1)} GWh/yr ≈ {t.achievableWithHomes.toLocaleString()} homes</span>
                    </div>
                  ))}
                </>
              )}
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
