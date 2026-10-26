import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

// "ANSI Shadow" figlet glyphs, 6 rows each: solid █ blocks plus box-drawing strokes that read as a drop shadow.
const G: Record<string, string[]> = {
  "A": [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  "B": ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
  "C": [" ██████╗", "██╔════╝", "██║     ", "██║     ", "╚██████╗", " ╚═════╝"],
  "D": ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
  "E": ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
  "J": ["     ██╗", "     ██║", "     ██║", "██   ██║", "╚█████╔╝", " ╚════╝ "],
  "L": ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"],
  "M": ["███╗   ███╗", "████╗ ████║", "██╔████╔██║", "██║╚██╔╝██║", "██║ ╚═╝ ██║", "╚═╝     ╚═╝"],
  "N": ["███╗   ██╗", "████╗  ██║", "██╔██╗ ██║", "██║╚██╗██║", "██║ ╚████║", "╚═╝  ╚═══╝"],
  "O": [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  "R": ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
  "V": ["██╗   ██╗", "██║   ██║", "██║   ██║", "╚██╗ ██╔╝", " ╚████╔╝ ", "  ╚═══╝  "],
  ".": ["   ", "   ", "   ", "   ", "██╗", "╚═╝"],
  " ": ["  ", "  ", "  ", "  ", "  ", "  "],
};
const LINES = ["JON JACOB", "D. VALDERAMA"];
const ROWS = LINES.flatMap(l => Array.from({ length: 6 }, (_, r) => [...l].map(c => G[c][r]).join("")));
const COLS = Math.max(...ROWS.map(r => r.length));
const CW = 10, CH = 18, GAP = 9; // cell size in viewBox units (0.556 aspect, like a mono terminal cell)
const VW = COLS * CW, VH = ROWS.length * CH + GAP;
const BAND = 10, SLANT = 1.8, DUR = 1700;
const END = COLS + BAND + ROWS.length * SLANT;
const yOf = (r: number) => r * CH + (r >= 6 ? GAP : 0);
// Box-drawing "shadow" glyphs as double-line polylines inside a cell, so strokes join cleanly across cells at any scale.
const SH: Record<string, number[][]> = {
  "═": [[0, 7, 10, 7], [0, 11, 10, 11]],
  "║": [[3, 0, 3, 18], [7, 0, 7, 18]],
  "╗": [[0, 7, 7, 7, 7, 18], [0, 11, 3, 11, 3, 18]],
  "╔": [[10, 7, 3, 7, 3, 18], [10, 11, 7, 11, 7, 18]],
  "╝": [[0, 11, 7, 11, 7, 0], [0, 7, 3, 7, 3, 0]],
  "╚": [[10, 11, 3, 11, 3, 0], [10, 7, 7, 7, 7, 0]],
};
const OP = [.25, .45, .7, 1];

// One frame of the decode sweep: settled glyphs behind the head, flickering pixels inside the band, blank ahead.
function frame(head: number) {
  const blocks = ["", ""]; let shadow = ""; const noise: [number, number, number][] = [];
  ROWS.forEach((row, r) => {
    const h = head - r * SLANT, y = yOf(r);
    let run = -1;
    const flush = (c: number) => { if (run >= 0) { blocks[r >= 6 ? 1 : 0] += `M${run * CW},${y}h${(c - run) * CW}v${CH}h${-(c - run) * CW}z`; run = -1; } };
    for (let c = 0; c < row.length; c++) {
      const f = row[c], x = c * CW;
      if (c < h - BAND && f !== " ") {
        if (f === "█") { if (run < 0) run = c; continue; }
        SH[f]?.forEach(l => { shadow += `M${x + l[0]},${y + l[1]}`; for (let i = 2; i < l.length; i += 2) shadow += `L${x + l[i]},${y + l[i + 1]}`; });
      } else if (c < h && f !== " ") noise.push([x, y, OP[(Math.random() * OP.length) | 0]]);
      flush(c);
    }
    flush(row.length);
  });
  return { blocks, shadow, noise };
}

function AsciiName({ play }: { play: boolean }) {
  const [head, setHead] = useState(-1);
  const raf = useRef(0);
  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setHead(END);
    const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min((t - t0) / DUR, 1); setHead(END * (1 - (1 - p) ** 3)); if (p < 1) raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => { if (play) run(); return () => cancelAnimationFrame(raf.current); }, [play, run]);
  const { blocks, shadow, noise } = useMemo(() => frame(head), [head]);
  const replay = () => { if (head >= END && matchMedia("(hover: hover)").matches) run(); };
  return <h1 className="ascii-name mt-7" onMouseEnter={replay}>
    <span className="sr-only">Jon Jacob D. Valderama</span>
    <svg aria-hidden viewBox={`0 0 ${VW} ${VH}`} className="ascii-art">
      <path d={shadow} fill="none" stroke="rgba(108,255,138,.5)" strokeWidth="1.6" />
      <path d={blocks[0]} fill="#f1f6ef" />
      <path d={blocks[1]} fill="#b9dcc0" />
      {noise.map(([x, y, o], i) => <rect key={i} x={x} y={y} width={CW} height={CH} fill="var(--g)" opacity={o} />)}
    </svg>
  </h1>;
}
export default memo(AsciiName);
