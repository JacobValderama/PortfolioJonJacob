import type React from "react";
import { useEffect, useRef, useState } from "react";

const LOG = `[14:02:11 ERROR]: Could not pass event PlayerInteractEvent to TokioShop
java.util.ConcurrentModificationException at ShopLedger.commit(ShopLedger.java:88)`;
type Case = { id: string; label: string; raw: string; parse: boolean; errors: string[]; result: Record<string, string>; fallback?: boolean };
const CASES: Case[] = [
  { id: "valid", label: "valid output", parse: true, errors: [],
    raw: `{"severity": "high", "plugin": "TokioShop",\n "summary": "Concurrent ledger write during shop interaction",\n "action": "lock ledger commit per region"}`,
    result: { severity: "high", plugin: "TokioShop", summary: "Concurrent ledger write during shop interaction", action: "lock ledger commit per region" } },
  { id: "malformed", label: "malformed JSON", parse: false, errors: ["JSONDecodeError: Expecting ',' delimiter: line 2 column 3"], fallback: true,
    raw: `Sure! Here is the incident:\n{"severity": "high" "plugin": "TokioShop",\n "summary": "ledger issue"`,
    result: { severity: "medium", plugin: "unknown", summary: "[raw] Could not pass event PlayerInteractEvent to TokioShop", action: "escalate to staff" } },
  { id: "schema", label: "schema violation", parse: true, errors: ["severity: Input should be 'low', 'medium' or 'high' [input='catastrophic']", "action: Field required"], fallback: true,
    raw: `{"severity": "catastrophic", "plugin": "TokioShop",\n "summary": "The server is basically on fire"}`,
    result: { severity: "medium", plugin: "TokioShop", summary: "[raw] Could not pass event PlayerInteractEvent to TokioShop", action: "escalate to staff" } },
];
const STEPS = ["llm.generate()", "json.parse()", "Incident.validate()", "deliver"];

export default function GuardrailsDemo() {
  const [ci, setCi] = useState(0), [step, setStep] = useState(-1);
  const timers = useRef<number[]>([]);
  const c = CASES[ci];
  const failAt = !c.parse ? 1 : c.errors.length ? 2 : 99;
  const run = (i = ci) => {
    timers.current.forEach(clearTimeout); setCi(i); setStep(0);
    timers.current = [1, 2, 3].map(s => window.setTimeout(() => setStep(s), s * 650));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const state = (s: number) => step < s ? "idle" : s === failAt && step >= s ? "fail" : s === 3 && c.fallback ? "warn" : "ok";
  const color = { idle: "var(--dim)", ok: "var(--g)", fail: "var(--red)", warn: "var(--amber)" };

  return <div className="box p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="a text-[11px] uppercase">live demo · ai reliability</div><h3 className="med mt-1 text-xl text-white">Guarding LLM output with schemas & fallbacks</h3></div>
      <div className="flex flex-wrap gap-2">{CASES.map((k, i) => <button key={k.id} onClick={() => run(i)} className={`px-3 py-1.5 text-[12px] ${ci === i && step >= 0 ? "btn-g" : "btn-o"}`}>{k.label}</button>)}</div>
    </div>
    <p className="sans b mt-3 max-w-2xl text-[15px]">An LLM turns a raw server error into a typed incident. Pick a scenario to see what happens when the model misbehaves: the system stays predictable either way.</p>

    <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px]">
      {STEPS.map((s, i) => { const st = state(i); return <div key={s} className="flex items-center gap-2">
        <span className="border px-2.5 py-1 transition-colors duration-300" style={{ borderColor: st === "idle" ? "var(--line)" : color[st], color: color[st], boxShadow: st === "idle" ? "none" : `0 0 14px -6px ${color[st]}` }}>
          {st === "ok" ? "✓" : st === "fail" ? "✗" : st === "warn" ? "↺" : "·"} {s}</span>
        {i < 3 && <span className="d">→</span>}</div>; })}
      {step < 0 && <button onClick={() => run()} className="btn-g ml-auto px-4 py-1.5">run pipeline ▸</button>}
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <Pane title="input · server.log" body={<pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--red)]/90">{LOG}</pre>} />
      <Pane title={`model output · ${c.label}`} dim={step < 1} body={<pre className="whitespace-pre-wrap text-[12px] leading-relaxed">{c.raw}</pre>} />
      <Pane title="validation · pydantic" dim={step < 2} body={<pre className="whitespace-pre-wrap text-[12px] leading-relaxed"><span className="text-[#8fd3ff]">class</span> Incident(BaseModel):{"\n"}  severity: Literal[<span className="g">"low","medium","high"</span>]{"\n"}  plugin: str{"\n"}  summary: str = Field(max_length=<span className="a">120</span>){"\n"}  action: str
        {step >= 2 && c.errors.length > 0 && <span className="mt-3 block border-t border-dashed border-[var(--line)] pt-3 text-[var(--red)]">{c.errors.map(e => "✗ " + e).join("\n")}</span>}
        {step >= 2 && !c.errors.length && c.parse && <span className="g mt-3 block border-t border-dashed border-[var(--line)] pt-3">✓ 4/4 fields valid</span>}</pre>} />
    </div>

    <div className={`mt-4 border p-4 transition-all duration-500 ${step >= 3 ? "opacity-100" : "opacity-30"}`} style={{ borderColor: step >= 3 ? (c.fallback ? "rgba(255,184,77,.5)" : "rgba(108,255,138,.5)") : "var(--line)" }}>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-[11px] uppercase"><span className={c.fallback ? "a" : "g"}>{step < 3 ? "awaiting result" : c.fallback ? "↺ fallback rule applied: deterministic incident" : "✓ typed incident delivered"}</span><span className="d">→ discord #staff-alerts</span></div>
      <div className="grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">{Object.entries(c.result).map(([k, v]) => <div key={k} className="min-w-0 break-words"><span className="a">{k}</span><span className="d">=</span>"{v}"</div>)}</div>
    </div>
  </div>;
}
const Pane = ({ title, body, dim }: { title: string; body: React.ReactNode; dim?: boolean }) =>
  <div className={`overflow-hidden border border-[rgba(108,255,138,.14)] bg-[#070907] transition-opacity duration-500 ${dim ? "opacity-35" : ""}`}>
    <div className="d border-b border-[rgba(108,255,138,.1)] bg-[rgba(255,255,255,.02)] px-3 py-1.5 text-[10.5px]">{title}</div>
    <div className="thin-scroll overflow-x-auto p-3">{body}</div></div>;
