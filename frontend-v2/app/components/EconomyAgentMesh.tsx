import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

type MeshEdge = { x1: number; y1: number; x2: number; y2: number };

const MAX_FULL_MESH = 12;

function buildEdges(pts: { x: number; y: number }[]): MeshEdge[] {
  const n = pts.length;
  if (n < 2) return [];
  if (n > MAX_FULL_MESH) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / n;
    const cy = pts.reduce((s, p) => s + p.y, 0) / n;
    return pts.map((p) => ({ x1: cx, y1: cy, x2: p.x, y2: p.y }));
  }
  const out: MeshEdge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      out.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y });
    }
  }
  return out;
}

/**
 * Wraps a 2-column agent grid; draws SVG edges between all agent nodes (full mesh up to 12 agents,
 * then hub-and-spoke) with animated dashed strokes.
 */
export default function EconomyAgentMesh({
  agentCount,
  children,
}: {
  agentCount: number;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<MeshEdge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reactId = useId();
  const gradId = `econ-mesh-${reactId.replace(/:/g, "")}`;

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setSize({ w: wrap.offsetWidth, h: wrap.offsetHeight });
    const rect = wrap.getBoundingClientRect();
    const els = wrap.querySelectorAll<HTMLElement>("[data-economy-node]");
    const pts: { x: number; y: number }[] = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      pts.push({
        x: r.left + r.width / 2 - rect.left,
        y: r.top + r.height / 2 - rect.top,
      });
    });
    setEdges(buildEdges(pts));
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const schedule = () => requestAnimationFrame(() => requestAnimationFrame(measure));
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, agentCount]);

  return (
    <div ref={wrapRef} className="economy-mesh">
      {size.w > 0 && size.h > 0 && edges.length > 0 && (
        <svg
          className="economy-mesh__svg"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(123, 47, 255, 0.5)" />
              <stop offset="50%" stopColor="rgba(255, 149, 0, 0.55)" />
              <stop offset="100%" stopColor="rgba(0, 180, 255, 0.45)" />
            </linearGradient>
          </defs>
          {edges.map((e, i) => (
            <line
              key={`${e.x1}-${e.y1}-${e.x2}-${e.y2}-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={`url(#${gradId})`}
              className="economy-mesh__line"
              style={{ animationDelay: `${(i % 8) * 0.22}s` }}
            />
          ))}
        </svg>
      )}
      {children}
    </div>
  );
}
