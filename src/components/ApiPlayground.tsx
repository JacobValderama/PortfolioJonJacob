import { useState } from "react";
import { EMAIL, GITHUB } from "../data";

type Ep = { m: "GET" | "POST"; path: string; status: number; body: unknown; req?: unknown };
const EPS: Ep[] = [
  { m: "GET", path: "/api/v1/jon", status: 200, body: { name: "Jon Jacob D. Valderama", role: "Backend Developer & Student Leader", org: "GDG on Campus — TUP Manila", location: "Manila, PH (GMT+8)", open_to_work: true, github: GITHUB } },
  { m: "GET", path: "/api/v1/projects", status: 200, body: { count: 1, items: [{ slug: "tokyocoresmp", type: "game-infrastructure", stack: ["Java", "Linux/Debian", "Automation"], status: "running" }] } },
  { m: "GET", path: "/api/v1/experience", status: 200, body: [{ org: "Google Developer Groups on Campus", role: "Backend Development Core Lead", since: 2026, status: "active" }, { org: "TokyoCoreSMP", role: "Backend & Plugin Developer", since: 2026, status: "active" }] },
  { m: "GET", path: "/api/v1/stack", status: 200, body: { languages: ["Java", "Python"], infra: ["Docker", "Linux", "Nginx", "Bash"], learning: ["Gemini API", "Claude", "Pydantic", "Tool Calling"] } },
  { m: "POST", path: "/api/v1/contact", status: 422, req: { name: "Recruiter", email: "not-an-email", message: "" }, body: { detail: [{ loc: ["body", "email"], msg: "value is not a valid email address", type: "value_error" }, { loc: ["body", "message"], msg: "String should have at least 1 character", type: "string_too_short" }], hint: `email me directly: ${EMAIL}` } },
];
const color = (s: number) => (s < 300 ? "var(--g)" : s < 500 ? "var(--amber)" : "var(--red)");

function Json({ v }: { v: unknown }) {
  const html = JSON.stringify(v, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|\b(\d+)\b/g, (m, s, colon, kw, num) =>
    s ? `<span style="color:${colon ? "#8fd3ff" : "var(--g)"}">${s}</span>${colon ?? ""}` : kw ? `<span style="color:var(--amber)">${kw}</span>` : num ? `<span style="color:var(--amber)">${num}</span>` : m);
  return <pre className="overflow-x-auto text-[12.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ApiPlayground() {
  const [i, setI] = useState(0), [res, setRes] = useState<{ ep: Ep; ms: number } | null>(null), [busy, setBusy] = useState(false);
  const ep = EPS[i];
  const send = () => { setBusy(true); setRes(null); const ms = 18 + Math.round(Math.random() * 40); setTimeout(() => { setRes({ ep, ms }); setBusy(false); }, 250 + ms * 4); };
  return <div className="box">
    <div className="flex flex-wrap gap-2 border-b border-[var(--line)] p-3">
      <select value={i} onChange={e => { setI(+e.target.value); setRes(null); }} aria-label="Endpoint" className="min-w-0 flex-1 border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-base outline-none sm:text-[13px] focus:border-[var(--g)]">
        {EPS.map((e, k) => <option key={e.path} value={k}>{e.m}  {e.path}</option>)}
      </select>
      <button onClick={send} disabled={busy} className="bg-[var(--g)] px-5 py-2 text-[13px] text-[var(--bg)] transition hover:shadow-[0_0_20px_rgba(108,255,138,.5)] disabled:opacity-60">{busy ? "sending…" : "Send ↵"}</button>
    </div>
    <div className="grid md:grid-cols-2">
      <div className="min-w-0 overflow-x-auto border-b border-[var(--line)] p-4 md:border-b-0 md:border-r">
        <div className="d mb-2 text-[11px] uppercase">request</div>
        <pre className="text-[12.5px]"><span className="a">{ep.m}</span> {ep.path} HTTP/1.1{"\n"}<span className="d">Host: jon.dev{"\n"}Accept: application/json</span>{ep.req ? "\n" : ""}</pre>
        {ep.req ? <Json v={ep.req} /> : null}
      </div>
      <div className="min-h-[220px] min-w-0 overflow-x-auto p-4">
        <div className="d mb-2 flex justify-between text-[11px] uppercase"><span>response</span>{res && <span><span style={{ color: color(res.ep.status) }}>{res.ep.status} {res.ep.status === 200 ? "OK" : "Unprocessable Entity"}</span> · {res.ms}ms</span>}</div>
        {busy && <div className="d text-[13px]">awaiting response<span className="cur ml-1" /></div>}
        {res && <div className="fade"><Json v={res.ep.body} /></div>}
        {!busy && !res && <div className="d text-[13px]">pick an endpoint and hit Send</div>}
      </div>
    </div>
  </div>;
}
