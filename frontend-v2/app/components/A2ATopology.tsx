import { motion } from "framer-motion";
import type { HirePhase } from "~/components/ManagerHirePanel";
import type { RegistryAgentRecord } from "~/lib/telosApi";

const MAX_WORKERS = 8;

function workerLabel(a: RegistryAgentRecord): string {
  const c = a.capabilities?.[0];
  if (c && c.length <= 14) return c;
  if (a.name.length <= 12) return a.name;
  return `${a.name.slice(0, 10)}…`;
}

export default function A2ATopology({
  agents,
  phase,
  activeAgentId,
}: {
  agents: RegistryAgentRecord[];
  phase: HirePhase;
  activeAgentId?: string;
}) {
  const workers = agents.slice(0, MAX_WORKERS);
  const n = Math.max(workers.length, 1);
  const w = 520;
  const h = 168;
  const cx = w / 2;
  const userY = 32;
  const mgrY = 82;
  const workerY = 132;
  const span = Math.min(380, 32 + (n - 1) * 50);
  const x0 = cx - span / 2;
  const step = n <= 1 ? 0 : span / (n - 1);

  const live = phase !== "idle" && phase !== "done" && phase !== "error";
  const hireDone = phase === "done";
  const payments = hireDone ? 1 : 0;
  const hires = hireDone ? 1 : 0;

  return (
    <div className="a2a-topology">
      <div className="a2a-topology__head">
        <div>
          <p className="a2a-topology__title">LIVE MONITOR · A2A TOPOLOGY</p>
          <p className="a2a-topology__sub">ECONOMY TOPOLOGY</p>
        </div>
        <div className="a2a-topology__badges">
          {live && <span className="a2a-topology__live">LIVE</span>}
          <span className="a2a-topology__fps">REALTIME</span>
        </div>
      </div>

      <div className="a2a-topology__stats">
        <span>
          <strong className="a2a-topology__stat-num a2a-topology__stat-num--blue">{payments}</strong>{" "}
          <span className="a2a-topology__stat-label">PAYMENTS</span>
        </span>
        <span>
          <strong className="a2a-topology__stat-num a2a-topology__stat-num--orange">—</strong>{" "}
          <span className="a2a-topology__stat-label">USDC VOL</span>
        </span>
        <span>
          <strong className="a2a-topology__stat-num a2a-topology__stat-num--orange">{hires}</strong>{" "}
          <span className="a2a-topology__stat-label">A2A HIRES</span>
        </span>
        <span>
          <strong className="a2a-topology__stat-num">{agents.length}</strong>{" "}
          <span className="a2a-topology__stat-label">AGENTS</span>
        </span>
      </div>

      <div className="a2a-topology__canvas">
        <svg viewBox={`0 0 ${w} ${h}`} className="a2a-topology__svg" aria-hidden>
          <defs>
            <linearGradient id="a2a-edge-user" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7b2fff" />
              <stop offset="100%" stopColor="#ff6b00" />
            </linearGradient>
          </defs>

          <line x1={cx} y1={userY + 12} x2={cx} y2={mgrY - 14} stroke="url(#a2a-edge-user)" strokeWidth={2} />

          {workers.map((_, i) => {
            const wx = n === 1 ? cx : x0 + i * step;
            return (
              <line
                key={i}
                x1={cx}
                y1={mgrY + 14}
                x2={wx}
                y2={workerY - 12}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            );
          })}

          <motion.g
            initial={false}
            animate={{ opacity: live ? [1, 0.72, 1] : 1 }}
            transition={{ duration: 1.8, repeat: live ? Infinity : 0 }}
          >
            <circle cx={cx} cy={userY} r={13} fill="#0a0a14" stroke="#7b2fff" strokeWidth={2.5} />
            <text
              x={cx}
              y={userY + 4}
              textAnchor="middle"
              fill="#e8e8f0"
              fontSize="11"
              style={{ fontFamily: "var(--font-mono)" }}
              fontWeight="700"
            >
              U
            </text>
          </motion.g>
          <text
            x={cx}
            y={userY + 28}
            textAnchor="middle"
            fill="#5c5c78"
            fontSize="9"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            You
          </text>

          <circle cx={cx} cy={mgrY} r={15} fill="#0a0a14" stroke="#2dd4bf" strokeWidth={2.5} />
          <text
            x={cx}
            y={mgrY + 4}
            textAnchor="middle"
            fill="#e8e8f0"
            fontSize="11"
            style={{ fontFamily: "var(--font-mono)" }}
            fontWeight="700"
          >
            M
          </text>
          <text
            x={cx}
            y={mgrY + 30}
            textAnchor="middle"
            fill="#5c5c78"
            fontSize="9"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Manager
          </text>

          {workers.map((ag, i) => {
            const wx = n === 1 ? cx : x0 + i * step;
            const active = ag.id === activeAgentId;
            return (
              <g key={ag.id}>
                <circle
                  cx={wx}
                  cy={workerY}
                  r={12}
                  fill="#0a0a14"
                  stroke={active ? "#ffba5c" : "#2dd4bf"}
                  strokeWidth={active ? 2.5 : 2}
                />
                <text
                  x={wx}
                  y={workerY + 3}
                  textAnchor="middle"
                  fill="#9898b0"
                  fontSize="9"
                  style={{ fontFamily: "var(--font-mono)" }}
                  fontWeight="600"
                >
                  W
                </text>
              </g>
            );
          })}
        </svg>

        {workers.length > 0 && (
          <div className="a2a-topology__worker-caps">
            {workers.map((ag) => (
              <span key={ag.id} className="a2a-topology__cap font-ui">
                {workerLabel(ag)}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="a2a-topology__legend font-mono">
        <span>
          <i className="a2a-topology__leg-line a2a-topology__leg-line--solid" /> User → Manager
        </span>
        <span>
          <i className="a2a-topology__leg-line a2a-topology__leg-line--dash" /> Manager → Worker
        </span>
      </p>
    </div>
  );
}
