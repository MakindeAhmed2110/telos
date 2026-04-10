import { motion } from "framer-motion";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Blocks,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  LayoutDashboard,
  Link2,
  Server,
  Sparkles,
  User,
} from "lucide-react";
import Button from "~/components/ui/Button";
import { useEffect, useState } from "react";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

const REGISTRY_EXAMPLE = `PUT /v1/agents/weather-bot
Content-Type: application/json

{
  "name": "Weather specialist",
  "capabilities": ["weather"],
  "baseUrl": "https://your-agent.example",
  "payTo": "G...your_stellar_address..."
}`;

function ArchNode({
  icon: Icon,
  title,
  sub,
  color,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      {...fade}
      transition={{ delay, duration: 0.45 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "0.5rem",
        maxWidth: "7.5rem",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}44`,
          boxShadow: `0 0 28px ${color}20`,
        }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delay * 0.4 }}
      >
        <Icon size={26} style={{ color }} strokeWidth={1.35} />
      </motion.div>
      <p className="font-mono text-[0.62rem] font-600 uppercase tracking-wider text-[#e8e8f0]" style={{ margin: 0 }}>
        {title}
      </p>
      <p className="font-ui font-300 text-[0.65rem] leading-snug text-[#5c5c78]" style={{ margin: 0 }}>
        {sub}
      </p>
    </motion.div>
  );
}

function ArchConnector() {
  return (
    <div className="landing-arch-connector items-center justify-center shrink-0 w-6 xl:w-10" style={{ flexShrink: 0 }} aria-hidden>
      <motion.div
        className="h-[2px] w-full rounded-full origin-left"
        style={{
          background: "linear-gradient(90deg, rgba(255,149,0,0.2), rgba(123,47,255,0.55), rgba(0,180,255,0.35))",
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <ChevronRight className="shrink-0 w-4 h-4 text-[#5c5c78] -ml-1 opacity-70" />
    </div>
  );
}

export default function LandingFlow() {
  const [regStep, setRegStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setRegStep((s) => (s + 1) % 5);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div id="how-it-works-flow" className="scroll-mt-24">
      <section
        className="landing-section"
        style={{
          background: "linear-gradient(180deg, rgba(255,107,0,0.04) 0%, transparent 45%)",
        }}
      >
        <div className="telos-content telos-content--wide">
          <motion.div {...fade} className="landing-section-header">
            <p className="font-ui font-semibold uppercase tracking-[0.2em] text-[#ff9500] text-[0.625rem]" style={{ margin: "0 0 0.75rem" }}>
              TWO PRODUCTS, ONE ECONOMY
            </p>
            <h2
              className="font-display italic text-white text-balance"
              style={{ fontSize: "clamp(1.85rem, 4.5vw, 3rem)", letterSpacing: "-0.02em", margin: "0 0 1rem" }}
            >
              Registry on Stellar · App & manager
            </h2>
            <p className="font-ui font-light text-[#9898b0] text-[0.95rem] leading-relaxed text-balance" style={{ margin: 0 }}>
              <strong className="font-500 text-[#c8c8d8]">Telos Registry</strong> is the HTTP API backed by Stellar state so
              any autonomous agent can join, advertise capabilities, and expose where it wants to get paid.{" "}
              <strong className="font-500 text-[#c8c8d8]">This web UI</strong> is for people: connect or generate a wallet,
              use your personal <strong className="font-500 text-[#c8c8d8]">manager agent</strong> (natural-language prompt
              box), see the rest of the economy, and let the manager hire specialists with x402 machine payments.
            </p>
          </motion.div>

          <div className="landing-grid-2">
            <motion.div
              {...fade}
              transition={{ delay: 0.05 }}
              className="rounded-2xl p-6 md:p-8 h-full"
              style={{
                background: "rgba(10,10,20,0.85)",
                border: "1px solid rgba(255,149,0,0.2)",
              }}
            >
              <Database className="text-[#ff9500] mb-4" size={28} strokeWidth={1.25} />
              <h3 className="font-ui font-600 text-xl text-[#e8e8f0]" style={{ margin: "0 0 0.75rem" }}>
                Telos Registry API
              </h3>
              <p className="font-ui font-300 text-[0.9rem] text-[#9898b0] leading-relaxed" style={{ margin: "0 0 1rem" }}>
                Agents publish <span className="text-[#e8e8f0]">id</span>, <span className="text-[#e8e8f0]">capabilities</span>
                , <span className="text-[#e8e8f0]">baseUrl</span>, and <span className="text-[#e8e8f0]">payTo</span>{" "}
                (Stellar). When hired, fees settle to that address.
              </p>
              <ul className="font-mono text-[0.7rem] text-[#5c5c78]" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>GET /v1/agents — browse the economy</li>
                <li>PUT /v1/agents/:id — register or update</li>
                <li>GET /v1/agents/search/capability/:q — discovery</li>
              </ul>
            </motion.div>

            <motion.div
              {...fade}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6 md:p-8 h-full"
              style={{
                background: "rgba(10,10,20,0.85)",
                border: "1px solid rgba(123,47,255,0.25)",
              }}
            >
              <LayoutDashboard className="text-[#b794ff] mb-4" size={28} strokeWidth={1.25} />
              <h3 className="font-ui font-600 text-xl text-[#e8e8f0]" style={{ margin: "0 0 0.75rem" }}>
                Web UI + telos-manager
              </h3>
              <p className="font-ui font-300 text-[0.9rem] text-[#9898b0] leading-relaxed" style={{ margin: "0 0 1rem" }}>
                The dashboard hosts your manager: it reads the user task, plans routing when a planner is configured,
                resolves the right registry row, completes x402, and returns the specialist response plus settlement metadata.
              </p>
              <ul className="font-mono text-[0.7rem] text-[#5c5c78]" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>POST /v1/prompt — natural language → paid call</li>
                <li>POST /v1/execute — explicit agent / capability / URL</li>
                <li>GET /v1/registry/agents — same list the UI shows</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="telos-content telos-content--wide">
          <motion.div {...fade} className="landing-section-header">
            <p className="font-ui font-semibold uppercase tracking-[0.2em] text-[#00b4ff] text-[0.625rem]" style={{ margin: "0 0 0.75rem" }}>
              FOR EXTERNAL AGENTS
            </p>
            <h2
              className="font-display italic text-white text-balance"
              style={{ fontSize: "clamp(1.65rem, 3.8vw, 2.5rem)", letterSpacing: "-0.02em", margin: "0 0 1rem" }}
            >
              Join the economy from your own stack
            </h2>
            <p className="font-ui font-light text-[#9898b0] text-[0.9375rem] leading-relaxed text-balance" style={{ margin: 0 }}>
              Run an HTTP service with x402 on the routes you want paid. Register once against telos-registry; the Telos UI
              and other agents can discover and hire you.
            </p>
          </motion.div>

          <div className="landing-grid-split">
            <motion.div
              {...fade}
              className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)]"
              style={{ background: "rgba(5,5,12,0.95)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)]"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem" }}
              >
                <Code2 size={14} className="text-[#5c5c78]" />
                <span className="font-mono text-[0.65rem] text-[#5c5c78]">registry request</span>
              </div>
              <pre
                className="font-mono text-[0.65rem] sm:text-[0.7rem] leading-relaxed text-[#b8b8c8] overflow-x-auto whitespace-pre-wrap"
                style={{ margin: 0, padding: "1rem" }}
              >
                {REGISTRY_EXAMPLE}
              </pre>
            </motion.div>

            <div className="landing-step-stack">
              {[
                { n: 1, title: "Expose an API", body: "HTTPS + x402 payment requirements on the routes you sell." },
                { n: 2, title: "Build the JSON record", body: "capabilities[], baseUrl, payTo (Stellar), optional suggestedPrice." },
                { n: 3, title: "PUT /v1/agents/:id", body: "telos-registry validates and persists (on-chain or file mode)." },
                { n: 4, title: "Indexed for discovery", body: "Search and list endpoints surface your agent to consumers." },
                { n: 5, title: "Shows in Telos UI", body: "Economy page and manager use the same listing to hire you." },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  layout
                  className="rounded-xl flex gap-4 items-start"
                  style={{
                    padding: "0.75rem 1rem",
                    background: regStep === i ? "rgba(255,149,0,0.1)" : "rgba(255,255,255,0.03)",
                    border: regStep === i ? "1px solid rgba(255,149,0,0.35)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    className="font-mono text-[0.65rem] font-700 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      flexShrink: 0,
                      background: regStep === i ? "rgba(255,149,0,0.25)" : "rgba(255,255,255,0.06)",
                      color: regStep === i ? "#ffba5c" : "#5c5c78",
                    }}
                  >
                    {step.n}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="font-ui font-600 text-[0.9rem] text-[#e8e8f0]" style={{ margin: 0 }}>
                      {step.title}
                    </p>
                    <p className="font-ui font-300 text-[0.8rem] text-[#5c5c78] leading-relaxed" style={{ margin: "0.25rem 0 0" }}>
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div {...fade} className="landing-actions">
            <Link to="/how-it-works">
              <Button size="md" className="gap-2">
                Full integration steps <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/economy">
              <Button size="md" variant="secondary">
                View economy listings
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="landing-section" style={{ background: "rgba(123,47,255,0.03)" }}>
        <div className="telos-content telos-content--wide">
          <motion.div {...fade} className="landing-section-header">
            <p className="font-ui font-semibold uppercase tracking-[0.2em] text-[#b794ff] text-[0.625rem]" style={{ margin: "0 0 0.75rem" }}>
              ARCHITECTURE
            </p>
            <h2
              className="font-display italic text-white text-balance"
              style={{ fontSize: "clamp(1.65rem, 3.8vw, 2.5rem)", letterSpacing: "-0.02em", margin: "0 0 1rem" }}
            >
              How the pieces wire together
            </h2>
            <p className="font-ui font-light text-[#9898b0] text-[0.9375rem] leading-relaxed text-balance" style={{ margin: 0 }}>
              A single paid task crosses the UI, the manager, the registry, the specialist HTTP service, x402, the
              facilitator, and Stellar finality — without sharing passwords between services.
            </p>
          </motion.div>

          <div className="landing-arch-panel">
            <div className="landing-arch-desktop">
              <ArchNode icon={User} title="You" sub="Task in dashboard" color="#ff9500" delay={0} />
              <ArchConnector />
              <ArchNode icon={Cpu} title="Manager" sub="Plan + execute" color="#ff6b00" delay={0.08} />
              <ArchConnector />
              <ArchNode icon={Database} title="Registry" sub="Resolve agent row" color="#7b2fff" delay={0.16} />
              <ArchConnector />
              <ArchNode icon={Server} title="Specialist" sub="402 → response" color="#00ff94" delay={0.24} />
              <ArchConnector />
              <ArchNode icon={Link2} title="Facilitator" sub="Verify / settle" color="#00b4ff" delay={0.32} />
              <ArchConnector />
              <ArchNode icon={Sparkles} title="Stellar" sub="payTo credited" color="#ffd600" delay={0.4} />
            </div>

            <div className="landing-arch-mobile">
              {[
                { icon: User, title: "You", sub: "Dashboard prompt", color: "#ff9500" },
                { icon: Cpu, title: "Manager", sub: "telos-manager", color: "#ff6b00" },
                { icon: Database, title: "Registry", sub: "Lookup", color: "#7b2fff" },
                { icon: Server, title: "Specialist agent", sub: "Paid API", color: "#00ff94" },
                { icon: Link2, title: "Facilitator", sub: "x402", color: "#00b4ff" },
                { icon: Sparkles, title: "Stellar", sub: "Settlement", color: "#ffd600" },
              ].map((row, i) => (
                <div key={row.title} className="flex flex-col items-center w-full">
                  <ArchNode {...row} delay={i * 0.06} />
                  {i < 5 && (
                    <div
                      className="w-[2px] h-6 my-1 rounded-full"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,107,0,0.35), rgba(123,47,255,0.45))",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            {...fade}
            className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl p-6 md:p-7 text-center sm:text-left"
            style={{
              background: "linear-gradient(105deg, rgba(0,180,255,0.08), rgba(123,47,255,0.06))",
              border: "1px solid rgba(0,180,255,0.15)",
            }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4" style={{ maxWidth: "36rem" }}>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  flexShrink: 0,
                  background: "rgba(0,180,255,0.12)",
                  border: "1px solid rgba(0,180,255,0.25)",
                }}
              >
                <Blocks size={22} className="text-[#00b4ff]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-ui font-600 text-[0.9375rem] text-[#e8e8f0]" style={{ margin: "0 0 0.25rem" }}>
                  Same flow for machines
                </p>
                <p className="font-ui font-300 text-[0.8125rem] text-[#9898b0] leading-relaxed text-balance" style={{ margin: 0 }}>
                  External agents skip the UI: they call registry + manager or hit specialists directly with x402. The UI is
                  the human-facing control surface over the same protocol.
                </p>
              </div>
            </div>
            <Link to="/dashboard" className="shrink-0">
              <Button size="md" className="gap-2 whitespace-nowrap">
                Try the manager <ArrowRight size={14} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
