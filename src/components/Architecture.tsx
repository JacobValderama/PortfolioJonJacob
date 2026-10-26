import { useState } from "react";

type Tier = "ingress" | "host" | "container" | "external";
type N = { id: string; tier: Tier; x: number; y: number; label: string; sub: string; title: string; body: string; spec?: string[]; term?: string; tags: string[]; planned?: boolean };
const W = 160, H = 50;
const TX: Record<Tier, number> = { ingress: 10, host: 235, container: 460, external: 685 };
const TIERS: { id: Tier; label: string }[] = [
  { id: "ingress", label: "01 · client & ingress" }, { id: "host", label: "02 · host vps · debian 12" },
  { id: "container", label: "03 · container · graalvm 25" }, { id: "external", label: "04 · external · out-of-band" },
];
const NODES: N[] = [
  { id: "java", tier: "ingress", x: 20, y: 70, label: "Java Players", sub: "tcp :25565", title: "Java Edition Players", body: "Primary player ingress. Game traffic lands on the Docker-managed port range and is forwarded into the Canvas engine.", spec: ["ports 25565–25580 tcp/udp", "game traffic · rcon · query"], tags: ["TCP", "Ingress"] },
  { id: "bedrock", tier: "ingress", x: 20, y: 180, label: "Bedrock Players", sub: "udp :19132", title: "Bedrock Players (Geyser)", body: "Cross-play ingress for Bedrock clients through a dedicated Geyser port.", spec: ["port 19132 tcp/udp"], tags: ["Geyser", "Cross-play"] },
  { id: "admin", tier: "ingress", x: 20, y: 330, label: "Admin / CI", sub: "gradle → ssh → rcon", title: "Deployment & CI Pipeline", body: "Plugins build locally with Gradle on a JDK 25 toolchain, ship over Ed25519 SSH/SCP into the server volume, then hot-reload through a Python RCON bridge, with no container restart.", term: "deploy.sh", spec: ["$ gradle build          # gradle 9.4.1 · jdk 25", "$ scp *.jar plugins/    # ed25519 transport", "$ rcon 'plugman reload TokioShop'", "→ zero-downtime update"], tags: ["Gradle", "SSH", "Python", "RCON"] },
  { id: "wings", tier: "host", x: 245, y: 70, label: "Pelican Wings", sub: "daemon · wings.service", title: "Pelican Wings Daemon", body: "Host daemon that owns the container lifecycle and talks to the web panel over a TLS control API.", spec: ["systemd: wings.service", "control api :8080 tls"], tags: ["Daemon", "TLS"] },
  { id: "docker", tier: "host", x: 245, y: 180, label: "Docker Engine", sub: "isolation runtime", title: "Docker Engine", body: "Runs the game server in an isolated container instead of a bare-metal process, so the runtime is reproducible and sandboxed from the host.", spec: ["host: 6 vCPU · 24 GB RAM · 150 GB NVMe", "os: Debian 12 Bookworm"], tags: ["Docker", "Linux"] },
  { id: "backup", tier: "host", x: 245, y: 330, label: "Backup Scheduler", sub: "host-level · planned", planned: true, title: "Off-Thread Host Backups (planned)", body: "Moving backups out of the game process to the host/panel level, so snapshots never lock chunk regions or hurt Folia tick rates. Target: nightly restic/rclone sync to S3.", tags: ["restic", "S3", "Roadmap"] },
  { id: "canvas", tier: "container", x: 470, y: 120, label: "Canvas 26.2", sub: "folia region ticking", title: "Canvas 26.2 Engine (Folia-derived)", body: "Multi-threaded game engine: each chunk region ticks on its own loop. Every plugin I write has to be region-safe, scheduling work through Folia's schedulers instead of a single main thread.", spec: ["RegionScheduler", "EntityScheduler", "GlobalRegionScheduler"], tags: ["Folia", "Concurrency", "GraalVM"] },
  { id: "plugins", tier: "container", x: 470, y: 225, label: "48 Plugins", sub: "22 Tokio* + ecosystem", title: "In-Process Plugin Suite", body: "48 plugins share the JVM heap: my proprietary Tokio suite plus ecosystem plugins. They run in-process, so correctness and thread safety matter more than isolation.", spec: ["core/      TokioCore TokioGen ...", "economy/   TokioEconomy TokioShop ...", "community/ TokioClaims TokioTeams ...", "gameplay/  TokioBrew TokioRTP ...", "ui/        TokioHUD TokioWelcome ...", "ecosystem/ Nexo LuckPerms FAWE ViaVersion ..."], tags: ["Java", "In-process"] },
  { id: "volume", tier: "container", x: 470, y: 330, label: "Persistent Volume", sub: "world + plugin data", title: "Persistent Storage Mount", body: "Durable volume mounted into the container for world data and plugin jars, and the deploy target for the CI pipeline.", tags: ["Storage"] },
  { id: "panel", tier: "external", x: 695, y: 70, label: "Pelican Panel", sub: "web control plane", title: "Pelican Web Panel", body: "Web control plane for the server. It drives the Wings daemon over an authenticated TLS API.", tags: ["Control plane"] },
  { id: "uptime", tier: "external", x: 695, y: 180, label: "Uptime Monitor", sub: "external probe", title: "External Heartbeat Monitor", body: "Monitoring lives outside the game process. An in-process monitor would die with the JVM on an OOM or deadlock and never send the alert. An external probe still fires when the server goes down.", spec: ["probe: tcp/query :25565", "on fail → discord alert"], tags: ["Uptime Kuma", "Reliability"] },
  { id: "discord", tier: "external", x: 695, y: 330, label: "Discord", sub: "alert webhooks", title: "Discord Webhooks", body: "Alert notifications from the external monitor land in staff channels instantly.", tags: ["Webhooks"] },
];
// Hand-routed orthogonal paths through the gutters between tiers, so no line crosses node text.
type Pt = [number, number];
const EDGES: { a: string; b: string; pts: Pt[]; label?: string; lp?: Pt }[] = [
  { a: "java", b: "docker", pts: [[180, 95], [205, 95], [205, 205], [245, 205]] },
  { a: "bedrock", b: "docker", pts: [[180, 205], [245, 205]] },
  { a: "wings", b: "docker", pts: [[325, 120], [325, 180]] },
  { a: "wings", b: "backup", pts: [[405, 108], [424, 108], [424, 355], [405, 355]] },
  { a: "docker", b: "canvas", pts: [[405, 215], [436, 215], [436, 155], [470, 155]] },
  { a: "canvas", b: "plugins", pts: [[550, 170], [550, 225]] },
  { a: "plugins", b: "volume", pts: [[550, 275], [550, 330]] },
  { a: "admin", b: "volume", pts: [[180, 368], [196, 368], [196, 402], [452, 402], [452, 368], [470, 368]], label: "ssh/scp", lp: [320, 402] },
  { a: "admin", b: "canvas", pts: [[180, 342], [216, 342], [216, 288], [446, 288], [446, 133], [470, 133]], label: "rcon reload", lp: [320, 288] },
  { a: "wings", b: "panel", pts: [[405, 84], [695, 84]], label: ":8080 tls", lp: [550, 84] },
  { a: "uptime", b: "docker", pts: [[695, 197], [405, 197]], label: "probe", lp: [575, 197] },
  { a: "uptime", b: "discord", pts: [[775, 230], [775, 330]], label: "alert", lp: [800, 282] },
];
function toPath(p: Pt[], r = 8) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1], [x, y] = p[i], [x2, y2] = p[i + 1];
    const l1 = Math.hypot(x - x0, y - y0), l2 = Math.hypot(x2 - x, y2 - y), k = Math.min(r, l1 / 2, l2 / 2);
    d += ` L${x - ((x - x0) / l1) * k},${y - ((y - y0) / l1) * k} Q${x},${y} ${x + ((x2 - x) / l2) * k},${y + ((y2 - y) / l2) * k}`;
  }
  const e = p[p.length - 1]; return d + ` L${e[0]},${e[1]}`;
}
const get = (id: string) => NODES.find(n => n.id === id)!;
function Line({ l }: { l: string }) {
  if (l.startsWith("→")) return <div className="g glow med">{l}</div>;
  const [code, ...c] = l.split("#"); const comment = c.length ? "#" + c.join("#") : "";
  // Column padding only on wider screens; on phones the comment drops to its own line so nothing runs off-screen.
  const txt = code.trimEnd(), pad = code.slice(txt.length);
  const body = txt.startsWith("$ ") ? <><span className="text-[#5b6b7a]">$ </span><span className="g">{txt.slice(2)}</span></> : <span className="text-[var(--fg)]">{txt}</span>;
  return <div className="whitespace-pre-wrap [overflow-wrap:anywhere] sm:whitespace-pre">{body}{comment && <><span className="hidden sm:inline">{pad}</span><span className="block pl-3 text-[#64748b] sm:inline sm:pl-0">{comment}</span></>}</div>;
}
const CHECK: [boolean, string][] = [
  [true, "Decoupled monitoring: external watchdog probe"], [true, "Zero vanilla potion effects: transient attributes"],
  [false, "Velocity proxy edge: rate-limiting & DDoS mitigation"], [false, "Off-thread host backups: restic → S3"],
  [false, "Dedicated MariaDB/PostgreSQL for ledgers & claims"],
];

const edgeTo = (sel: string, id: string) => EDGES.find(e => (e.a === sel && e.b === id) || (e.b === sel && e.a === id));

// Shared node detail: the side inspector on desktop, inline under the tapped tier on phones/tablets.
function Detail({ n, onSel }: { n: N; onSel?: (id: string) => void }) {
  const links = EDGES.filter(e => e.a === n.id || e.b === n.id).map(e => ({ id: e.a === n.id ? e.b : e.a, label: e.label }));
  return <div key={n.id} className="inspect">
    <div className="flex items-center gap-2 text-[11px] uppercase"><span className="h-1.5 w-1.5 rounded-full bg-[var(--g)] shadow-[0_0_8px_var(--g)]" /><span className="a">{n.tier} / {n.id}</span>{n.planned && <span className="d">· roadmap</span>}</div>
    <h4 className="med mt-2 text-lg text-white sm:text-xl">{n.title}</h4>
    <p className="sans b mt-3 text-[15px] leading-relaxed">{n.body}</p>
    {n.spec && <div className="mt-5 overflow-hidden border border-[rgba(108,255,138,.16)] bg-[#070907] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="flex items-center gap-2 border-b border-[rgba(108,255,138,.1)] bg-[rgba(255,255,255,.02)] px-3 py-1.5 text-[10.5px]">
        <span className="flex gap-1"><i className="h-2 w-2 rounded-full bg-[#3a3f3a]" /><i className="h-2 w-2 rounded-full bg-[#3a3f3a]" /><i className="h-2 w-2 rounded-full bg-[#3a3f3a]" /></span>
        <span className="d ml-1">bash — {n.term ?? `${n.id}.conf`}</span></div>
      <div className="thin-scroll overflow-x-auto p-3 text-[12px] leading-6">{n.spec.map((l, i) => <Line key={i} l={l} />)}</div>
    </div>}
    <div className="mt-4 flex flex-wrap gap-2">{n.tags.map(t => <span key={t} className="border border-[var(--line)] px-2 py-0.5 text-[11px] d">{t}</span>)}</div>
    {onSel && links.length > 0 && <div className="mt-5 border-t border-dashed border-[rgba(108,255,138,.13)] pt-4">
      <div className="d mb-2 text-[10.5px] uppercase tracking-[.12em]">connects to</div>
      <div className="flex flex-wrap gap-2">{links.map(l => <button key={l.id} onClick={() => onSel(l.id)} className="flow-chip inline-flex items-center gap-1.5 border border-[rgba(108,255,138,.3)] bg-[rgba(108,255,138,.04)] px-2.5 py-1.5 text-[12px] g">→ {get(l.id).label}{l.label && <span className="d">· {l.label}</span>}</button>)}</div>
    </div>}
  </div>;
}

/* Below lg the 875-wide diagram would shrink to unreadable text, so it becomes a vertical tier stack:
   full-width rows, linked nodes badged with their connection, and the selected node's detail opened inside its tier. */
function MobileStack({ sel, near, onSel }: { sel: string; near: Set<string>; onSel: (id: string) => void }) {
  return <div className="arch-grid p-3 sm:p-4 lg:hidden">
    {TIERS.map((t, ti) => { const nodes = NODES.filter(m => m.tier === t.id), open = nodes.find(m => m.id === sel);
      return <div key={t.id}>
        {ti > 0 && <div aria-hidden className="relative ml-6 h-5 w-px overflow-hidden bg-[rgba(108,255,138,.2)]"><span className="arch-drop absolute left-0 top-0 h-2 w-px bg-[var(--g)] shadow-[0_0_6px_var(--g)]" /></div>}
        <section className={`border bg-[rgba(10,13,10,.9)] transition-colors ${open ? "border-[rgba(108,255,138,.4)]" : "border-[rgba(108,255,138,.14)]"}`}>
          <header className="flex items-center justify-between gap-3 border-b border-dashed border-[rgba(108,255,138,.13)] px-3 py-2 text-[10.5px]"><span className="a min-w-0 truncate">{t.label}</span><span className="d shrink-0">{nodes.length} nodes</span></header>
          <div className="grid grid-cols-1 gap-px bg-[rgba(108,255,138,.07)] sm:grid-cols-2">{nodes.map(m => { const on = sel === m.id, link = on ? undefined : edgeTo(sel, m.id);
            return <button key={m.id} onClick={() => onSel(m.id)} aria-pressed={on} aria-label={m.title}
              className={`relative flex min-w-0 items-start gap-3 px-3 py-3 text-left transition-colors ${on ? "bg-[#0f1f12] shadow-[inset_2px_0_0_var(--g)]" : "bg-[#0b0e0b] active:bg-[#0f150f]"} ${nodes.length % 2 && m === nodes[nodes.length - 1] ? "sm:col-span-2" : ""}`}>
              {on ? <span className="relative mt-1 flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--g)] opacity-60" /><span className="relative h-2 w-2 rounded-full bg-[var(--g)]" /></span>
                : <span className={`mt-1 h-2 w-2 shrink-0 rounded-full border ${link ? "border-[var(--g)] bg-[rgba(108,255,138,.35)]" : m.planned ? "border-dashed border-[var(--dim)]" : "border-[#3a453a]"}`} />}
              <span className="min-w-0 flex-1">
                <span className={`block break-words text-[13px] leading-snug ${on ? "g" : m.planned ? "d" : near.has(m.id) ? "text-white" : "text-[var(--fg)]"}`}>{m.label}</span>
                <span className="d mt-0.5 block break-words text-[11px] leading-snug">{m.sub}</span>
              </span>
              {link && <span className="flow-chip shrink-0 border border-[rgba(108,255,138,.3)] px-1.5 py-px text-[10px] g">{link.label ?? "linked"}</span>}
            </button>; })}</div>
          {open && <div className="border-t border-[rgba(108,255,138,.2)] bg-[#090c09] p-4"><Detail n={open} onSel={onSel} /></div>}
        </section>
      </div>; })}
  </div>;
}

export default function Architecture() {
  const [sel, setSel] = useState("admin");
  const n = get(sel);
  const near = new Set([sel, ...EDGES.filter(e => e.a === sel || e.b === sel).flatMap(e => [e.a, e.b])]);
  return <div className="grid grid-cols-1 gap-6">
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[65fr_35fr]">
      <div className="box relative min-w-0 overflow-hidden">
        <MobileStack sel={sel} near={near} onSel={setSel} />
        <div className="arch-grid hidden p-3 lg:block">
          <svg viewBox="0 0 875 420" className="block w-full" role="img" aria-label="TokyoCoreSMP production architecture">
            <defs><filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6cff8a" floodOpacity=".55" /></filter></defs>
            {TIERS.map(t => <g key={t.id}><rect x={TX[t.id]} y={20} width={180} height={395} rx="2" fill="rgba(108,255,138,.015)" stroke="rgba(108,255,138,.13)" strokeDasharray="3 5" />
              <text x={TX[t.id] + 10} y={40} fill="var(--amber)" fontSize="10">{t.label}</text></g>)}
            {EDGES.map((e, i) => { const d = toPath(e.pts), hot = e.a === sel || e.b === sel;
              return <g key={i} className="arch-fade" style={{ opacity: hot ? 1 : .4 }}>
                <path d={d} fill="none" stroke={hot ? "var(--g)" : "rgba(108,255,138,.28)"} strokeWidth={hot ? 1.8 : 1.2} strokeDasharray={hot ? "6 6" : "3 6"} className={hot ? "flow" : ""} style={hot ? { filter: "drop-shadow(0 0 3px rgba(108,255,138,.7))" } : undefined} />
                {hot && <circle r="3" fill="#d8ffe0"><animateMotion dur="1.8s" repeatCount="indefinite" path={d} /></circle>}
                {e.label && e.lp && <text x={e.lp[0]} y={e.lp[1] - 6} textAnchor="middle" fill={hot ? "var(--g)" : "var(--dim)"} fontSize="9.5" style={{ paintOrder: "stroke", stroke: "#0b0e0b", strokeWidth: 5 }}>{e.label}</text>}
              </g>; })}
            {NODES.map(m => { const on = sel === m.id;
              return <g key={m.id} className="node arch-fade" style={{ opacity: near.has(m.id) ? 1 : .4 }} onClick={() => setSel(m.id)} tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(m.id))} role="button" aria-pressed={on} aria-label={m.title}>
                <rect x={m.x} y={m.y} width={W} height={H} rx="2" fill={on ? "#0f1f12" : "#0d110d"} stroke={on ? "var(--g)" : near.has(m.id) && sel ? "rgba(108,255,138,.45)" : "var(--line)"} strokeWidth={on ? 1.6 : 1.2} strokeDasharray={m.planned ? "4 4" : undefined} filter={on ? "url(#glow)" : undefined} />
                <text x={m.x + 12} y={m.y + 21} fill={on ? "var(--g)" : m.planned ? "var(--dim)" : "#fff"} fontSize="12.5">{m.label}</text>
                <text x={m.x + 12} y={m.y + 37} fill="var(--dim)" fontSize="9.5">{m.sub}</text>
                {on && <><circle cx={m.x + W - 12} cy={m.y + 12} r="6" fill="var(--g)" opacity=".25" className="ping" /><circle cx={m.x + W - 12} cy={m.y + 12} r="3" fill="var(--g)" /></>}
              </g>; })}
          </svg>
        </div>
        <div className="d flex flex-wrap justify-between gap-2 border-t border-[rgba(108,255,138,.08)] px-4 py-2 text-[11px]"><span><span className="lg:hidden">tap</span><span className="hidden lg:inline">click</span> a node to trace its connections</span><span>- - - dashed = planned</span></div>
      </div>
      <div className="box hidden min-w-0 p-4 sm:p-5 lg:block"><Detail n={n} /></div>
    </div>
    <div className="box min-w-0 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h4 className="med text-white">hardening checklist <span className="d text-[12px]">· from my architecture audit v2.0</span></h4><span className="text-[12px] d">{CHECK.filter(c => c[0]).length}/{CHECK.length} shipped</span></div>
      <ul className="grid gap-2 text-[13px] md:grid-cols-2">{CHECK.map(([ok, t]) => <li key={t} className="flex gap-3"><span className={`shrink-0 whitespace-pre ${ok ? "g" : "d"}`}>{ok ? "[x]" : "[ ]"}</span><span className={ok ? "" : "d"}>{t}</span></li>)}</ul>
    </div>
  </div>;
}
