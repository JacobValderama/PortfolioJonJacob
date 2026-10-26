import { useMemo, useState } from "react";

type P = { n: string; d: string; t: string[] };
const CATS: { id: string; label: string; items: P[] }[] = [
  { id: "core", label: "Core & Infrastructure", items: [
    { n: "TokioCore", d: "The backbone of the server — handles core SMP quality-of-life utilities, navigation (/spawn, /home, /tpa), player moderation, and cross-region safeguards.", t: ["Folia", "Moderation"] },
    { n: "TokioGen", d: "Folia-native chunk pre-generation engine that pre-generates entire worlds across multiple CPU threads without server lag.", t: ["Multi-threaded", "Folia"] },
    { n: "TokioTabBridge", d: "Scoreboard collision safeguard that syncs player data with the TAB plugin and prevents scoreboard flicker or packet desync on Folia.", t: ["Packets", "Sync"] },
    { n: "TokioPreferences", d: "Player settings suite using modern Minecraft native modal dialogs (toggle chat pings, particles, scoreboard visibility, and player interactions).", t: ["Dialogs", "UX"] },
  ] },
  { id: "economy", label: "Economy & Progression", items: [
    { n: "TokioEconomy", d: "High-performance, cross-region concurrent economy engine and transaction ledger built specifically for Folia's multi-threaded model.", t: ["Concurrency", "Ledger"] },
    { n: "TokioShop", d: "Dynamic supply-and-demand server market with algorithmic price fluctuation, buy/sell rate curves, and anti-duplication locks.", t: ["Algorithms", "Locks"] },
    { n: "TokioJobs", d: "Career progression system featuring milestone perks, daily contracts, leveling rewards, and an Adventure GUI.", t: ["Progression", "Adventure"] },
    { n: "TokioRewards", d: "Daily login streak reward engine with consumable reward pouches and custom Nexo textures.", t: ["Streaks", "Nexo"] },
  ] },
  { id: "community", label: "Teams, Claims & Community", items: [
    { n: "TokioClaims", d: "Region-safe territory claiming system with playtime-earned claimblocks, sub-claims, and team bank upkeep decay.", t: ["Regions", "Folia"] },
    { n: "TokioTeams", d: "Team/guild management suite featuring team levels, bank accounts, shared vaults, and team booster perks.", t: ["Guilds", "Vaults"] },
    { n: "TokioLeaderboards", d: "Multi-category statistics and seasonal points ranking system integrated with Nexo glyphs.", t: ["Stats", "Seasons"] },
    { n: "TokioTop", d: "Dynamic placeholder engine that feeds team leaderboards into holograms, TAB, and GUI menus.", t: ["Placeholders", "Integration"] },
    { n: "TokioReports", d: "Interactive dialog-based reporting tool for reporting rulebreakers or bugs directly to staff with in-game ticket inspection.", t: ["Ticketing", "Dialogs"] },
    { n: "TokioTags", d: "High-performance cosmetic chat tags and 2-line player nametag renderer.", t: ["Rendering", "Cosmetics"] },
  ] },
  { id: "gameplay", label: "Custom Gameplay", items: [
    { n: "TokioBrew", d: "Zero-lag 3-step brewing (Heated Cauldron → Distillation → Zero-Tick Barrel Aging) with 10 custom drinks, dynamic quality stars, interactive chest codex GUI, and 100% custom physical attributes (zero vanilla potion effects).", t: ["Zero-lag", "State machine"] },
    { n: "TokioLimits", d: "Game balance and anti-cheat enforcement — gates Netherite upgrades, regulates resource gathering scarcity, and enforces a strict ban on vanilla invisibility potions.", t: ["Anti-cheat", "Balance"] },
    { n: "TokioRTP", d: "Region-aware random teleportation engine that finds safe wilderness locations across chunk regions without freezing the server.", t: ["Async", "Folia"] },
    { n: "TokioAirdrop", d: "Timed supply drop events that spawn loot crates from the sky with parachute physics, smoke beacons, and tier loot tables.", t: ["Scheduling", "Physics"] },
    { n: "TokioPose", d: "Folia-safe physical player pose mechanics (sitting on stairs/carpets, laying down, crawling into 1-block gaps, and player piggybacking).", t: ["Folia", "Entities"] },
  ] },
  { id: "ui", label: "UI & Presentation", items: [
    { n: "TokioHUD", d: "Custom HUD overlay engine managing on-screen indicators and widget positioning.", t: ["HUD", "Rendering"] },
    { n: "TokioWelcome", d: "Welcoming visual splash and informational introduction displayed to players upon connecting.", t: ["Onboarding"] },
    { n: "TokioAnnouncements", d: "Scheduled broadcast manager for automated server tips, discord links, and rule reminders.", t: ["Scheduling"] },
  ] },
];
export const PLUGIN_COUNT = CATS.reduce((a, c) => a + c.items.length, 0);

export default function PluginExplorer() {
  const [cat, setCat] = useState("all"), [q, setQ] = useState("");
  const list = useMemo(() => CATS.flatMap(c => c.items.map(p => ({ ...p, c: c.label, id: c.id })))
    .filter(p => (cat === "all" || p.id === cat) && (p.n + p.d + p.t.join(" ")).toLowerCase().includes(q.toLowerCase())), [cat, q]);
  const tab = (id: string, label: string, n: number) =>
    <button key={id} onClick={() => setCat(id)} className={`px-3 py-1.5 text-[12px] transition ${cat === id ? "btn-g" : "btn-o"}`}>{label} <span className="opacity-60">{n}</span></button>;

  return <div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <div className="flex flex-wrap gap-2">{tab("all", "all", PLUGIN_COUNT)}{CATS.map(c => tab(c.id, c.label.toLowerCase(), c.items.length))}</div>
      <label className="box flex w-full items-center gap-2 sm:ml-auto px-3 py-1.5 text-[13px] sm:w-56"><span className="g">grep</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="search plugins" aria-label="Search plugins" className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-[var(--dim)] sm:text-[13px]" /></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(p => <article key={p.n} className="box hov fade flex flex-col p-4 sm:p-5">
        <div className="d text-[11px] uppercase">{p.c}</div>
        <h4 className="med mt-2 text-lg text-white"><span className="g">▸</span> {p.n}</h4>
        <p className="sans b mt-2 flex-1 text-[14.5px] leading-relaxed">{p.d}</p>
        <div className="mt-4 flex flex-wrap gap-2">{p.t.map(t => <span key={t} className="border border-[var(--line)] px-2 py-0.5 text-[11px] d">{t}</span>)}</div>
      </article>)}
      {!list.length && <div className="d col-span-full py-8 text-center">grep: no plugins match "{q}"</div>}
    </div>
  </div>;
}
