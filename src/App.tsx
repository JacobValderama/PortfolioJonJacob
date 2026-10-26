import React, { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";

import Architecture from "./components/Architecture";
import PluginExplorer, { PLUGIN_COUNT } from "./components/PluginExplorer";
import GuardrailsDemo from "./components/GuardrailsDemo";
import AsciiName from "./components/AsciiName";
import ApiPlayground from "./components/ApiPlayground";
import { EMAIL, GITHUB } from "./data";
const NAV = [["about", "#about"], ["projects", "#projects"], ["api", "#api"], ["learning", "#learning"], ["experience", "#experience"], ["stack", "#stack"], ["contact", "#contact"]];
const LOGS: [string, string][] = [
  ["OK", "tokyocore.service active (running)"], ["INFO", "plugin loaded: inventory-manager"], ["OK", "external probe · tcp :25565 ok"],
  ["INFO", "webhook → discord: server online"], ["INFO", "GET /api/v1/jon 200 · 23ms"], ["WARN", "learning: ai-agents still compiling..."],
  ["OK", "deploy.sh finished · 0 errors"], ["INFO", "gdg-tup: backend dev core lead · active"], ["OK", "health check passed"],
];
const BOOT = [
  ["[  OK  ]", "Mounted /home/jon"], ["[  OK  ]", "Started GDG on Campus TUP Manila backend core"], ["[  OK  ]", "Loaded modules: java python docker linux"],
  ["[  OK  ]", "Reached target tokyocoresmp.service"], ["[ WAIT ]", "Learning AI integrations ... in progress"], ["[  OK  ]", "Portfolio ready."],
];
const LEARN = [
  ["llm-apis", "LLM APIs & Data Extraction", "Connecting applications to models like Gemini and Claude to build helpful assistants and transform unstructured text into validated JSON.", ["Gemini API", "Pydantic"]],
  ["agents", "Building AI Agents", "Experimenting with multi-step workflows where AI can reason through tasks, invoke specific backend tools, and accomplish multi-stage objectives.", ["Python", "Tool Calling"]],
  ["dev-ai", "Practical AI in Dev Workflows", "Exploring how AI can assist software development by parsing raw server logs, summarizing issues, and drafting release notes.", ["Log Parsing", "Webhooks"]],
  ["guardrails", "Combining AI with Code Logic", "Studying how to guard applications with schema validation and fallback rules so systems remain predictable even when AI outputs vary.", ["Validation", "Fallbacks"]],
] as const;
const EXP = [
  { y: "2026 — present", t: "Google Developer Groups on Campus", r: "Backend Development Core Lead · TUP Manila", d: "Backend Development Core Lead. Supporting technical initiatives, exploring backend services, and collaborating on campus developer projects and workshops.", p: ["Part of the core developer team supporting backend systems and community initiatives for the academic term."] },
  { y: "2026 — present", t: "TokyoCoreSMP", r: "Community Minecraft Server", d: "Developing backend features, custom Java game plugins, and managing automated server maintenance for an active gaming community.", p: ["Authored custom server plugins in Java to streamline player mechanics and inventory management.", "Implemented scheduled backup routines and performance monitoring on Linux instances.", "Integrated Discord webhooks for instant server status and administrative alerts."] },
];
const CORE = [
  ["backend", "APIs & Server Logic", "Building dependable RESTful services using Python and Java, structured request validation, clean routing, and relational database queries."],
  ["infra", "Linux & Containerization", "Containerizing applications with Docker, managing Ubuntu/Debian instances, writing bash automation scripts, and setting up Nginx reverse proxies."],
  ["ai", "Practical AI Integration", "Leveraging models like Gemini and Claude for data summarization, typing AI responses into rigid schemas, and exploring agentic step-by-step loops."],
];
const WORDS = ["web services", "reliable systems", "practical AI"];

function useReveal(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0, rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [ready]);
}

function Boot({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0), [out, setOut] = useState(false);
  useEffect(() => {
    if (n < BOOT.length) { const t = setTimeout(() => setN(n + 1), 170); return () => clearTimeout(t); }
    const a = setTimeout(() => setOut(true), 350), b = setTimeout(onDone, 850); return () => { clearTimeout(a); clearTimeout(b); };
  }, [n, onDone]);
  return <div className="boot" style={{ opacity: out ? 0 : 1 }} onClick={onDone}>
    <div className="d mb-4">jjv-portfolio v1.0 · tty1 · press any key to skip</div>
    {BOOT.slice(0, n).map(([s, m]) => <div key={m}><span className={s.includes("OK") ? "g" : "a"}>{s}</span> {m}</div>)}
    <span className="cur mt-2" />
  </div>;
}

// Typed word lives in a grid cell sized by the longest word, so the line never wraps or shifts.
function Typer() {
  const [i, setI] = useState(0), [n, setN] = useState(0), [del, setDel] = useState(false);
  useEffect(() => {
    const w = WORDS[i];
    const t = setTimeout(() => {
      if (!del && n === w.length) return setDel(true);
      if (del && n === 0) { setDel(false); setI((i + 1) % WORDS.length); return; }
      setN(n + (del ? -1 : 1));
    }, !del && n === w.length ? 1800 : del ? 30 : 65);
    return () => clearTimeout(t);
  }, [n, del, i]);
  return <span className="inline-grid whitespace-nowrap align-bottom">
    <span className="invisible" style={{ gridArea: "1/1" }}>{WORDS.reduce((a, b) => (b.length > a.length ? b : a))}_</span>
    <span className="g glow" style={{ gridArea: "1/1" }}>{WORDS[i].slice(0, n)}<span className="cur" /></span>
  </span>;
}

const CH = "!<>-_/[]{}=+*^?#01";
function Scramble({ text }: { text: string }) {
  const [t, setT] = useState(text);
  const go = () => { let f = 0; const id = setInterval(() => { f++; setT(text.split("").map((c, i) => (i < f / 2 ? c : CH[Math.floor(Math.random() * CH.length)])).join("")); if (f >= text.length * 2) { clearInterval(id); setT(text); } }, 22); };
  return <span onMouseEnter={go}>{t}</span>;
}

// Storage can throw in private/embedded browsers; never let that crash the app.
const store = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
};

// Scroll state lives in leaf components (rAF-throttled) so scrolling never re-renders the whole page.
function useScrollSpy() {
  const [st, setSt] = useState({ p: 0, sec: "about" });
  useEffect(() => {
    let raf = 0;
    const f = () => { raf = 0; const h = document.documentElement; const p = Math.round((h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100) / 100;
      const sec = NAV.map(n => n[0]).filter(n => (document.getElementById(n)?.getBoundingClientRect().top ?? 1e9) < 140).pop() ?? "about";
      setSt(o => (o.p === p && o.sec === sec ? o : { p, sec })); };
    const on = () => { if (!raf) raf = requestAnimationFrame(f); };
    f(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return st;
}
const SECTIONS = NAV.map(n => n[0]);
function NavLinks() {
  const { sec } = useScrollSpy();
  return <nav className="hidden items-center gap-1 lg:flex">{NAV.map(([n, h]) => <a key={h} href={h} className={`navlink px-2.5 py-1.5 transition-colors hover:text-[var(--g)] ${sec === n ? "on g" : "d"}`}>./<Scramble text={n} /></a>)}</nav>;
}
function SectionPath() {
  const { sec } = useScrollSpy();
  return <span className="truncate"><span className="g">jon@tup</span><span className="d">:</span><span className="a">~/{sec === "about" ? "" : sec}</span><span className="cur ml-0.5 !h-[1em] !w-[.5em]" /></span>;
}
function ScrollBar() {
  const { p } = useScrollSpy();
  return <div aria-hidden className="absolute inset-x-0 -bottom-px h-px"><div className="h-px origin-left bg-[var(--g)] shadow-[0_0_10px_var(--g)]" style={{ transform: `scaleX(${p})` }} /></div>;
}
let logSeq = 0;
function HeroStatus() {
  const [stats, setStats] = useState<[string, number][]>([["cpu", 34], ["mem", 58], ["disk", 41], ["focus", 92]]);
  const [logs, setLogs] = useState<{ id: number; t: string; lvl: string; m: string }[]>([]);
  useEffect(() => {
    let n = 0; const tick = () => { if (document.hidden) return; const [lvl, m] = LOGS[n % LOGS.length]; const t = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Manila" });
      setLogs(l => [...l.slice(-5), { id: logSeq++, t, lvl, m }]); n++;
      setStats(s => s.map(([k, v]) => [k, k === "focus" ? 88 + Math.round(Math.random() * 10) : Math.max(12, Math.min(90, v + Math.round((Math.random() - .5) * 24)))])); };
    for (let i = 0; i < 4; i++) tick(); const id = setInterval(tick, 1800); return () => clearInterval(id);
  }, []);
  return <>
    <div className="layer grid grid-cols-2 gap-px bg-[rgba(108,255,138,.08)] sm:grid-cols-4 lg:grid-cols-2">
      {stats.map(([k, v]) => <div key={k} className="bg-[rgba(8,11,8,.9)] p-3"><div className="d flex justify-between text-[11px]"><span>{k}</span><span className="tabular-nums">{v}%</span></div>
        <div className="mt-2 h-1.5 bg-[rgba(108,255,138,.1)]"><div className="bar h-full w-full origin-left bg-[var(--g)]" style={{ transform: `scaleX(${v / 100})` }} /></div></div>)}
    </div>
    <div className="h-32 overflow-hidden px-4 py-3 text-[11.5px] leading-6 sm:h-36 sm:text-[12px]">
      {logs.map(l => <div key={l.id} className="logline truncate"><span className="d">{l.t}</span> <span className={l.lvl === "OK" ? "g" : l.lvl === "WARN" ? "a" : "text-[#8fd3ff]"}>{l.lvl.padEnd(4)}</span> {l.m}</div>)}
    </div>
  </>;
}

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => { const f = () => setT(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Manila" })); f(); const id = setInterval(f, 1000); return () => clearInterval(id); }, []);
  return <span className="tabular-nums">{t}</span>;
}


function Cmd({ c, children, id, title, n, lede }: { c: string; children: ReactNode; id: string; title: string; n: string; lede?: ReactNode }) {
  return <section id={id} className="scroll-mt-16 py-16 md:py-24">
    <div className="reveal mb-6 flex items-center gap-3 md:mb-8"><span className="eyebrow a">{n}</span><span className="h-px flex-1 bg-gradient-to-r from-[var(--line)] to-transparent" /><span className="eyebrow d">{id}</span></div>
    <div className="mb-10 grid grid-cols-1 gap-5 md:mb-14 md:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] md:items-end md:gap-12">
      <div className="min-w-0">
        <div className="reveal overflow-hidden text-[12.5px] sm:text-[13.5px]"><span className="g">jon@tup</span><span className="d">:</span><span className="a">~</span><span className="d">$ </span>
          <span className="type" style={{ ["--n" as string]: c.length, ["--dur" as string]: `${c.length * 0.04}s` }}>{c}</span></div>
        <h2 className="reveal display mt-4 text-[2.5rem] text-white sm:text-5xl md:text-6xl" style={{ transitionDelay: ".15s" }}>{title}</h2>
      </div>
      {lede && <p className="reveal sans b text-[16px] leading-relaxed md:pb-1.5 md:text-[17px]" style={{ transitionDelay: ".3s" }}>{lede}</p>}
    </div>
    <div className="reveal" style={{ transitionDelay: ".35s" }}>{children}</div>
  </section>;
}
const Tag = ({ s }: { s: string }) => <span className="chip">{s}</span>;
function Box({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <div className={`box hov relative p-4 pt-7 sm:p-6 sm:pt-8 md:p-8 md:pt-9 ${className}`}><span className="notch">┤ {title} ├</span>{children}</div>;
}
const NOW = [["now.building", `${PLUGIN_COUNT} TokyoCoreSMP plugins`], ["now.learning", "AI agents & tool calling"], ["now.leading", "GDG TUP backend dev core"], ["open_to", "internships & junior roles"]];
const METRICS = [[String(PLUGIN_COUNT), "custom java plugins"], ["5", "plugin subsystems"], ["Folia", "multi-threaded runtime"], ["0s", "downtime per deploy"]];
const CORE_TOOLS: Record<string, string[]> = { backend: ["Java", "Python", "REST", "SQL"], infra: ["Docker", "Debian", "Bash", "Nginx"], ai: ["Gemini", "Claude", "Pydantic", "Tool calling"] };
const HASH = ["a3f9c2e", "7d41b08"];

export default function App() {
  const [booted, setBooted] = useState(() => store.get("booted") === "1"), [copied, setCopied] = useState(false);
  const [cmd, setCmd] = useState(""), [log, setLog] = useState<ReactNode[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [plugOpen, setPlugOpen] = useState(false), [menu, setMenu] = useState(false), [archOpen, setArchOpen] = useState(false);
  useReveal(booted);
  const heroRef = useRef<HTMLElement>(null), tiltRef = useRef<HTMLDivElement>(null);
  const tiltMove = (e: React.MouseEvent) => { if (!matchMedia("(min-width: 1024px) and (hover: hover)").matches) return; const r = heroRef.current!.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tiltRef.current?.style.setProperty("--ry", `${-12 + x * 14}deg`); tiltRef.current?.style.setProperty("--rx", `${6 - y * 10}deg`); };
  const tiltReset = () => { tiltRef.current?.style.removeProperty("--ry"); tiltRef.current?.style.removeProperty("--rx"); };
  useEffect(() => { document.documentElement.classList.add("js"); if (booted) store.set("booted", "1"); }, [booted]);
  const focusCmd = () => { inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); inputRef.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (!booted) return setBooted(true); if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement !== inputRef.current)) { e.preventDefault(); focusCmd(); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [booted]);
  const copy = () => { navigator.clipboard?.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const run = (e: FormEvent) => {
    e.preventDefault(); const c = cmd.trim().toLowerCase(); setCmd(""); if (!c) return;
    const hit = NAV.find(([n]) => c === n || c === `cd ${n}`);
    let res: ReactNode;
    if (hit) { document.querySelector(hit[1])?.scrollIntoView({ behavior: "smooth" }); res = <span className="g">→ jumping to {hit[0]}</span>; }
    else if (c === "help" || c === "ls") res = <span>available: {SECTIONS.join("  ")}  github  email  clear</span>;
    else if (c === "github") { open(GITHUB, "_blank"); res = <span className="g">opening github…</span>; }
    else if (c === "email") { copy(); res = <span className="g">copied {EMAIL}</span>; }
    else if (c === "clear") { setLog([]); return; }
    else if (c === "sudo hire jon") res = <span className="a">permission granted. see `contact`.</span>;
    else res = <span className="text-[var(--red)]">command not found: {c}. try `help`</span>;
    setLog(l => [...l.slice(-3), <div key={Date.now()}><span className="d">$ {c}</span><br />{res}</div>]);
  };

  return <div className="min-h-dvh overflow-x-clip">
    {!booted && <Boot onDone={() => setBooted(true)} />}

    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(10,12,10,.82)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 text-[12px] sm:px-5">
        <a href="#about" className="flex min-w-0 items-center gap-3">
          <span className="monogram">jv</span>
          <SectionPath />
        </a>
        <NavLinks />
        <span className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="d hidden tabular-nums xl:inline">MNL <Clock /></span>
          <button onClick={focusCmd} className="kbd hidden sm:inline-flex">⌘K</button>
          <button onClick={() => setMenu(!menu)} className="kbd w-9 justify-center lg:hidden" aria-expanded={menu} aria-label="Menu">{menu ? "✕" : "☰"}</button>
        </span>
      </div>
      {menu && <nav className="fade border-t border-[var(--line)] lg:hidden"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
        {NAV.map(([n, h], i) => <a key={h} href={h} onClick={() => setMenu(false)} className="flex items-baseline gap-2 bg-[var(--bg)] px-4 py-3.5 text-[13px] hover:text-[var(--g)]"><span className="a text-[10px]">{String(i).padStart(2, "0")}</span>{n}</a>)}
        <a href={GITHUB} target="_blank" rel="noreferrer" className="g flex items-baseline gap-2 bg-[var(--bg)] px-4 py-3.5 text-[13px]"><span className="text-[10px] opacity-60">↗</span>github</a>
      </div></nav>}
      <ScrollBar />
    </header>

    <main className={`mx-auto max-w-6xl px-4 sm:px-5 ${booted ? "flick" : ""}`}>
      <section id="about" ref={heroRef} onMouseMove={tiltMove} onMouseLeave={tiltReset} className="relative isolate scroll-mt-20 pb-6 pt-12 sm:pt-16 md:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden">
          <div className="halo left-[4%] top-[6%] h-80 w-80" />
          <div className="halo right-[4%] top-[16%] h-[28rem] w-[28rem]" />
          <div className="floor" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--bg)] to-transparent" />
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="min-w-0">
            <div className="pill"><i className="dot" />available for internships<span className="d">·</span><span className="d">manila, ph</span></div>
            <AsciiName play={booted} />
            <p className="mt-6 text-[15px] leading-relaxed sm:text-lg"><span className="g">&gt;</span> Backend developer & student leader<br className="hidden sm:block" /> building <Typer /></p>
            <p className="sans b mt-5 max-w-xl text-[16px] leading-relaxed sm:text-[17px]">Backend Development Core Lead at <span className="text-white">GDG on Campus — TUP Manila</span>. I'm someone who genuinely loves learning, whether that's diving deeper into code, figuring out how AI works, or exploring whatever new technology catches my eye. When I'm not studying, you'll usually find me playing games or tinkering with servers just to see what I can build.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-[13px]">
              <a href="#projects" className="btn-g px-5 py-3">view projects →</a>
              <a href="#contact" className="btn-o px-5 py-3">get in touch</a>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="btn-o px-5 py-3">github ↗</a>
            </div>
          </div>

          <div ref={tiltRef} className="tilt min-w-0">
            <div className="window overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[rgba(108,255,138,.12)] px-4 py-2.5 text-[12px]">
                <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[var(--red)]" /><i className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]" /><i className="h-2.5 w-2.5 rounded-full bg-[var(--g)]" /></span>
                <span className="d ml-2 truncate">jon@tup — status</span><span className="g ml-auto flex shrink-0 items-center gap-1.5"><i className="dot" />live</span>
              </div>
              <HeroStatus />
              <form onSubmit={run} className="border-t border-[rgba(108,255,138,.12)] px-4 py-3 text-[13px]" onClick={() => inputRef.current?.focus()}>
                {log.map((l, i) => <div key={i} className="mb-2">{l}</div>)}
                <label className="flex items-center gap-2"><span className="g">$</span>
                  <input ref={inputRef} value={cmd} onChange={e => setCmd(e.target.value)} placeholder="type `help` · ⌘K" className="min-w-0 flex-1 bg-transparent text-base caret-[var(--g)] outline-none placeholder:text-[var(--dim)] sm:text-[13px]" spellCheck={false} autoComplete="off" /></label>
              </form>
            </div>
          </div>
        </div>

        <div className="now mt-14 grid grid-cols-2 md:mt-20 md:grid-cols-4">
          {NOW.map(([k, v]) => <div key={k} className="now-cell"><div className="eyebrow a">{k}</div><div className="mt-2 text-[13.5px] leading-snug text-white sm:text-[14px]">{v}</div></div>)}
        </div>
      </section>

      <Cmd id="projects" n="01" c="cat projects/tokyocoresmp.md" title="Featured project" lede="One production system, end to end: the gameplay code, the runtime it runs on, and the pipeline that ships it.">
        <Box title="tokyocoresmp.service — active (running)">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="eyebrow a">game infrastructure · java backend</span><span className="g flex items-center gap-2 text-[12px]"><i className="dot" />online</span></div>
              <h3 className="display mt-5 text-[2.1rem] text-white sm:text-5xl md:text-[3.4rem]">TokyoCoreSMP<span className="block text-[var(--dim)]">Game Server</span></h3>
              <p className="sans b mt-5 text-[16px] leading-relaxed">Architected the backend for a community Minecraft server running Canvas, a Folia-derived multi-threaded engine, in Docker on Debian. I wrote {PLUGIN_COUNT} custom Java plugins covering core infrastructure, a concurrent economy, land claims and teams, custom gameplay mechanics, and player-facing UI, plus a Gradle → SSH → RCON pipeline that hot-reloads plugins with zero downtime.</p>
              <div className="mt-5 flex flex-wrap gap-2">{["Java", "Folia", "Docker", "Debian", "Gradle", "RCON"].map(s => <Tag key={s} s={s} />)}</div>
            </div>
            <div className="metrics grid grid-cols-2">
              {METRICS.map(([v, l]) => <div key={l} className="metric"><div className="display g glow text-[2rem] sm:text-[2.4rem]">{v}</div><div className="eyebrow d mt-2 !tracking-[.1em]">{l}</div></div>)}
            </div>
          </div>

          <div className="mt-8 border-t border-dashed border-[var(--line)] pt-5 text-[12px] leading-6">
            <button onClick={() => setPlugOpen(o => !o)} aria-expanded={plugOpen} className={`plugrow group flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-2 px-3 py-3 text-left ${plugOpen ? "open" : ""}`}>
              <span className="d">├─</span>
              <span className={`g inline-block text-[14px] transition-transform duration-300 ${plugOpen ? "rotate-90" : "group-hover:translate-x-0.5"}`}>▸</span>
              <span className="text-white group-hover:text-[var(--g)]">plugins/</span>
              <span className="d">{PLUGIN_COUNT} custom java plugins across 5 subsystems</span>
              {!plugOpen && <span className="hidden gap-1.5 xl:flex">{["TokioCore", "TokioEconomy", "TokioBrew"].map(n => <span key={n} className="border border-[var(--line)] px-1.5 text-[11px] d">{n}</span>)}<span className="px-1 text-[11px] d">+{PLUGIN_COUNT - 3}</span></span>}
              <span className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-[11px] ${plugOpen ? "btn-o" : "btn-g plugcta"}`}>{plugOpen ? "collapse ▴" : `explore ${PLUGIN_COUNT} plugins ▾`}</span>
            </button>
            <div className="grid grid-cols-1 transition-[grid-template-rows] duration-500 ease-out" style={{ gridTemplateRows: plugOpen ? "1fr" : "0fr" }}>
              <div className="overflow-hidden"><div className="ml-3 border-l border-dashed border-[var(--line)] py-6 pl-4 md:ml-5 md:pl-6"><PluginExplorer /></div></div>
            </div>
            <div className="mt-2 px-3"><span className="d">├─</span> monitor/ <span className="d">external heartbeat probe → discord alerts</span></div>
            <div className="px-3"><span className="d">└─</span> deploy/ <span className="d">gradle → ssh/scp → rcon hot-reload</span></div>
          </div>

          {/* Below lg the architecture is folded behind a toggle so the card stays short on phones; desktop always shows it. */}
          <div className="mt-6 border-t border-dashed border-[var(--line)] pt-5 lg:mt-10 lg:pt-8">
            <button onClick={e => { const btn = e.currentTarget; setArchOpen(o => { if (o && btn.getBoundingClientRect().top < 0) btn.scrollIntoView({ block: "start" }); return !o; }); }} aria-expanded={archOpen}
              className={`plugrow group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left text-[12px] lg:hidden ${archOpen ? "open" : ""}`}>
              <span className={`g inline-block text-[14px] transition-transform duration-300 ${archOpen ? "rotate-90" : ""}`}>▸</span>
              <span className="min-w-0 flex-1"><span className="block text-white">Production architecture</span><span className="d block text-[11px]">12 nodes · 4 tiers · hardening checklist</span></span>
              <span className="btn-o inline-flex shrink-0 items-center px-3 py-1.5 text-[11px]">{archOpen ? "hide ▴" : "view ▾"}</span>
            </button>
            <div className={`grid grid-cols-1 transition-[grid-template-rows] duration-500 ease-out lg:grid-rows-[1fr] ${archOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="min-h-0 overflow-hidden lg:overflow-visible"><div className="pt-5 lg:pt-0">
            <div className="mb-5 hidden flex-wrap items-end justify-between gap-3 lg:flex">
              <div><div className="eyebrow a">system design</div><h4 className="display mt-2 text-2xl text-white sm:text-3xl">Production architecture</h4></div>
              <span className="eyebrow d">canvas · folia · docker · debian</span>
            </div>
            <Architecture />
            </div></div>
            </div>
          </div>
        </Box>
      </Cmd>

      <Cmd id="api" n="02" c="curl -s localhost/api/v1 | jq" title="Query me like an API" lede="A tiny REST playground. Try the endpoints, including a request that fails validation on purpose.">
        <ApiPlayground />
      </Cmd>

      <Cmd id="learning" n="03" c="ls ~/learning/ai --long" title="Currently exploring in AI" lede="How modern LLMs and agent frameworks can solve real problems in software engineering.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{LEARN.map(([f, t, d, s], i) =>
          <Box key={f} title={`${f}.md`} className="flex flex-col">
            <div className="flex items-start justify-between gap-4"><h3 className="display text-[1.45rem] text-white sm:text-[1.6rem]">{t}</h3><span className="a shrink-0 pt-1 text-[12px]">{String(i + 1).padStart(2, "0")}</span></div>
            <p className="sans b mt-3 text-[15.5px] leading-relaxed">{d}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">{s.map(x => <Tag key={x} s={x} />)}</div>
          </Box>)}</div>
        <div className="mt-6"><GuardrailsDemo /></div>
      </Cmd>

      <Cmd id="experience" n="04" c="git log --oneline --graph experience" title="Where I've contributed & led">
        <div className="gitlog">{EXP.map((e, i) =>
          <article key={e.t} className="commit grid grid-cols-1 gap-3 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
            <div className="relative pl-7 text-[12px] md:pl-8">
              <span className="commit-dot" />
              <div className="a">{HASH[i]}{i === 0 && <span className="g"> (HEAD → main)</span>}</div>
              <div className="d mt-1">{e.y}</div>
            </div>
            <div className="min-w-0 pl-7 md:pl-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><h3 className="display text-[1.7rem] text-white sm:text-3xl">{e.t}</h3><span className="g inline-flex items-center gap-1.5 border border-[rgba(108,255,138,.3)] bg-[rgba(108,255,138,.06)] px-2 py-0.5 text-[11px]"><i className="dot" />active</span></div>
              <div className="mt-2 text-[13px] text-[var(--fg)]">{e.r}</div>
              <p className="sans b mt-4 max-w-2xl text-[16px] leading-relaxed">{e.d}</p>
              <ul className="mt-5 grid gap-2.5 text-[13px] leading-relaxed">{e.p.map(x => <li key={x} className="flex gap-3"><span className="g shrink-0">+</span><span>{x}</span></li>)}</ul>
            </div>
          </article>)}</div>
      </Cmd>

      <Cmd id="stack" n="05" c="cat /etc/foundations.conf" title="Core foundations">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{CORE.map(([k, t, d], i) =>
          <Box key={k} title={`[${k}]`} className="flex flex-col">
            <div className="a text-[12px]">{String(i + 1).padStart(2, "0")}</div>
            <h3 className="display mt-3 text-[1.45rem] text-white">{t}</h3>
            <p className="sans b mt-3 text-[15.5px] leading-relaxed">{d}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">{CORE_TOOLS[k].map(x => <Tag key={x} s={x} />)}</div>
          </Box>)}</div>
      </Cmd>

      <Cmd id="contact" n="06" c="./contact.sh --open-to-work" title="Let's connect">
        <div className="contact box relative isolate overflow-hidden p-6 sm:p-10 md:p-14">
          <div aria-hidden className="contact-grid" />
          <div className="eyebrow g flex items-center gap-2"><i className="dot" />connection established</div>
          <h3 className="display mt-6 max-w-4xl text-[2.2rem] text-white sm:text-5xl md:text-6xl">Interested in collaborating, hiring, or discussing backend & AI?</h3>
          <p className="sans b mt-6 max-w-2xl text-[16px] leading-relaxed sm:text-[17px]">I am currently looking for software engineering internships, junior backend developer opportunities, and student community tech collaborations. Feel free to reach out anytime!</p>
          <a href={`mailto:${EMAIL}`} className="mailto mt-10 inline-block max-w-full break-all text-[1.05rem] sm:text-2xl md:text-3xl"><span className="g">→ </span>{EMAIL}</a>
          <div className="mt-6 flex flex-wrap gap-3 text-[13px]">
            <a href={`mailto:${EMAIL}`} className="btn-g px-5 py-3">send an email</a>
            <button onClick={copy} className="btn-o px-5 py-3">{copied ? "copied ✓" : "copy email"}</button>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="btn-o px-5 py-3">github ↗</a>
          </div>
          <dl className="mt-12 grid grid-cols-1 gap-px border border-[var(--line)] bg-[var(--line)] text-[13px] sm:grid-cols-2 lg:grid-cols-4">{[["location", "Manila, PH (GMT+8)"], ["role", "Backend Dev · GDG TUP Manila"], ["focus", "Java, Python, Docker, AI APIs"], ["status", "Open for opportunities"]].map(([a, b]) =>
            <div key={a} className="bg-[#0b0e0b] p-4"><dt className="eyebrow a">{a}</dt><dd className="mt-2 text-white">{b}</dd></div>)}</dl>
        </div>
      </Cmd>
    </main>

    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 text-[12px] sm:px-5 md:grid-cols-3 md:items-center">
        <div className="flex items-center gap-3"><span className="monogram">jv</span><div><div className="text-white">Jon Jacob D. Valderama</div><div className="d mt-0.5">backend · infra · practical ai</div></div></div>
        <div className="d md:text-center">© {new Date().getFullYear()} · <span className="tabular-nums">MNL <Clock /></span></div>
        <div className="flex gap-5 md:justify-end"><a href={GITHUB} target="_blank" rel="noreferrer" className="d hover:text-[var(--g)]">github ↗</a><a href={`mailto:${EMAIL}`} className="d hover:text-[var(--g)]">email</a><a href="#about" className="g">↑ cd ~</a></div>
      </div>
    </footer>
  </div>;
}
