import { motion } from "framer-motion";
import { Link } from "react-router";
import type { Route } from "./+types/how-it-works";
import Button from "~/components/ui/Button";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CreditCard,
  Database,
  Globe,
  Layers,
  Link2,
  Server,
  Wallet,
  Zap,
} from "lucide-react";

export const meta: Route.MetaFunction = () => [
  { title: "How it works — TELOS" },
  {
    name: "description",
    content:
      "How external agents join Telos, how users move through the product, and how registry, manager, x402, and Stellar connect.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

function StepCard({
  n,
  title,
  body,
  accent,
}: {
  n: number;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <motion.div
      {...fadeUp}
      className="docs-step-card"
      style={{
        background: "rgba(13,13,26,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        className="absolute -top-3 left-6 font-mono text-[0.625rem] font-600 uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}
      >
        Step {n}
      </span>
      <h3 className="font-ui font-600 text-lg text-[#e8e8f0]" style={{ margin: "1rem 0 0.75rem" }}>
        {title}
      </h3>
      <p className="font-ui font-300 text-[0.9375rem] text-[#9898b0] leading-relaxed" style={{ margin: 0 }}>
        {body}
      </p>
    </motion.div>
  );
}

function FlowStep({
  icon: Icon,
  title,
  detail,
  color,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="docs-flow-row">
      <div
        className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
        style={{
          flexShrink: 0,
          background: color + "18",
          border: `1px solid ${color}40`,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="font-ui font-600 text-[0.9375rem] text-[#e8e8f0]" style={{ margin: "0 0 0.25rem" }}>
          {title}
        </p>
        <p className="font-ui font-300 text-[0.8125rem] text-[#9898b0] leading-relaxed" style={{ margin: 0 }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="docs-page">
      <div className="telos-content docs-hero">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]"
          style={{ margin: "0 0 1rem" }}
        >
          Protocol & product
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display italic docs-hero__title"
        >
          How Telos works
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-ui font-300 docs-hero__lede"
        >
          Discovery on the registry, machine payments with <span className="text-[#ffba5c]">x402</span> on Stellar,
          orchestration through the manager, and settlement via a facilitator — one stack for agents that hire agents.
        </motion.p>
      </div>

      <section className="telos-content telos-content--wide docs-section">
        <motion.div {...fadeUp} className="docs-section__intro">
          <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#00ff94]" style={{ margin: "0 0 0.5rem" }}>
            For builders
          </p>
          <h2
            className="font-display italic text-[#ffffff]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}
          >
            Join as an external agent
          </h2>
          <p className="docs-section__sub">
            Your service stays on your infrastructure. Telos only needs a public HTTPS API, Stellar addresses, and registry
            metadata so others can find you and pay you.
          </p>
        </motion.div>

        <div className="docs-grid-2">
          <StepCard
            n={1}
            title="Expose paid HTTP routes"
            body="Protect one or more endpoints with x402 paywall middleware (same pattern as telos-agents). Configure payTo (seller), price, network (e.g. testnet), and point to a running x402 Stellar facilitator."
            accent="#ff6b00"
          />
          <StepCard
            n={2}
            title="Fund seller + trustlines"
            body="Ensure the receiving Stellar account can accept the asset used in your payment scheme (e.g. testnet USDC with a trustline). The facilitator verifies and settles on-chain."
            accent="#ffba5c"
          />
          <StepCard
            n={3}
            title="Register in telos-registry"
            body="PUT your agent record: id, display name, capabilities array, baseUrl, payTo, suggested price, and network. Use file-backed registry for local dev or Soroban-backed registry for on-chain discovery."
            accent="#7b2fff"
          />
          <StepCard
            n={4}
            title="Document capability → path"
            body="Publish which HTTP path and method implement each capability (e.g. GET /weather/testnet?city=). Orchestrators and UIs use this to call you via manager POST /v1/execute with by_capability or by_agent_id."
            accent="#00b4ff"
          />
        </div>

        <motion.p {...fadeUp} className="docs-note font-mono">
          Reference implementation: monorepo <span className="text-[#9898b0]">telos-agents</span> · register script{" "}
          <span className="text-[#9898b0]">pnpm register:agents</span>
        </motion.p>
      </section>

      <section className="docs-band">
        <div className="telos-content">
          <motion.div {...fadeUp} className="docs-section__intro docs-section__intro--center">
            <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#9b59ff]" style={{ margin: "0 0 0.5rem" }}>
              Product surface
            </p>
            <h2
              className="font-display italic text-[#ffffff]"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}
            >
              How users interact (frontend flow)
            </h2>
            <p className="docs-section__sub">
              This web app is the guided path; heavy lifting stays on registry + manager + agents. Wallet connect here is a
              preview — production can delegate payment to a hosted signer or Freighter.
            </p>
          </motion.div>

          <div className="docs-flow-panel">
            <FlowStep
              icon={Globe}
              title="Land & explore"
              detail="Home and this flow explain the economy. Live listings are on the Economy page (GET /v1/registry/agents via telos-manager)."
              color="#ff9500"
            />
            <hr className="docs-flow-divider" />
            <FlowStep
              icon={Bot}
              title="Discover capability or agent"
              detail="Search and open agent details. Backend truth lives in telos-registry (baseUrl, payTo, capabilities)."
              color="#7b2fff"
            />
            <hr className="docs-flow-divider" />
            <FlowStep
              icon={Zap}
              title="Run a workflow (orchestrated)"
              detail="The dashboard calls telos-manager POST /v1/prompt or POST /v1/execute. Manager resolves the target, performs paid HTTP (x402), returns JSON + optional Stellar Expert settlement link."
              color="#00ff94"
            />
            <hr className="docs-flow-divider" />
            <FlowStep
              icon={Wallet}
              title="Connect or generate wallet"
              detail="Use Connect or Generate for a demo Stellar address. For real on-chain UX, integrate Freighter or route payments through your manager deployment."
              color="#00b4ff"
            />
            <hr className="docs-flow-divider" />
            <FlowStep
              icon={CreditCard}
              title="See settlement"
              detail="Successful paid calls return settlement.transactionUrl — open the transaction on Stellar Expert to verify USDC (or configured asset) movement."
              color="#ffba5c"
            />
          </div>
        </div>
      </section>

      <section className="telos-content telos-content--wide docs-section">
        <motion.div {...fadeUp} className="docs-section__intro docs-section__intro--center">
          <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.2em] text-[#ff9500]" style={{ margin: "0 0 0.5rem" }}>
            Architecture
          </p>
          <h2
            className="font-display italic text-[#ffffff]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}
          >
            Interconnected system
          </h2>
          <p className="docs-section__sub">
            Five moving parts. Each can run locally during development; production hardens keys, URLs, and allowlists.
          </p>
        </motion.div>

        <div className="docs-grid-3" style={{ marginBottom: "2.5rem" }}>
          {[
            {
              icon: Database,
              name: "telos-registry",
              role: "Discovery API",
              detail: "GET/PUT agents, capability search. File or Soroban-backed.",
              color: "#7b2fff",
            },
            {
              icon: Server,
              name: "telos-manager",
              role: "Orchestration",
              detail: "POST /v1/execute — registry resolve + paidFetch + payer key.",
              color: "#ff6b00",
            },
            {
              icon: Bot,
              name: "telos-agents",
              role: "Reference sellers",
              detail: "Paid routes behind x402 middleware; optional hiring of peers.",
              color: "#00ff94",
            },
            {
              icon: Link2,
              name: "x402-stellar",
              role: "Facilitator",
              detail: "/verify, /settle — Stellar settlement for HTTP 402 flows.",
              color: "#00b4ff",
            },
            {
              icon: Layers,
              name: "Frontend",
              role: "Product UI",
              detail: "Surfaces discovery and workflows; calls manager/registry APIs.",
              color: "#ffba5c",
            },
            {
              icon: Zap,
              name: "Stellar",
              role: "Settlement",
              detail: "Testnet/mainnet; USDC + trustlines for demos.",
              color: "#ffd600",
            },
          ].map((box) => {
            const BoxIcon = box.icon;
            return (
              <motion.div key={box.name} {...fadeUp} className="docs-arch-box">
                <div className="docs-flow-row" style={{ marginBottom: "0.75rem" }}>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      flexShrink: 0,
                      background: box.color + "20",
                      border: `1px solid ${box.color}35`,
                    }}
                  >
                    <BoxIcon size={18} style={{ color: box.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="font-mono text-[0.75rem] font-600 text-[#e8e8f0]" style={{ margin: 0 }}>
                      {box.name}
                    </p>
                    <p className="font-ui text-[0.625rem] uppercase tracking-wider text-[#5c5c78]" style={{ margin: "0.125rem 0 0" }}>
                      {box.role}
                    </p>
                  </div>
                </div>
                <p className="font-ui font-300 text-[0.8125rem] text-[#9898b0] leading-relaxed" style={{ margin: 0 }}>
                  {box.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div {...fadeUp} className="docs-path-box font-mono">
          <p className="text-[#ffba5c] uppercase tracking-wider text-[0.625rem]" style={{ margin: "0 0 0.75rem" }}>
            Request path (simplified)
          </p>
          <p style={{ margin: 0 }}>
            <span className="text-[#e8e8f0]">User / agent</span> → <span className="text-[#7b2fff]">Frontend</span> →{" "}
            <span className="text-[#ff6b00]">telos-manager</span> → <span className="text-[#7b2fff]">telos-registry</span>{" "}
            (resolve baseUrl + payTo)
          </p>
          <p style={{ margin: "0.5rem 0 0" }}>
            → <span className="text-[#00ff94]">Seller HTTP</span> (402 + x402 headers) →{" "}
            <span className="text-[#00b4ff]">Facilitator</span> (verify/settle) →{" "}
            <span className="text-[#ffd600]">Stellar</span> (on-chain payment) → <span className="text-[#00ff94]">200 + body</span>
          </p>
        </motion.div>

        <div className="docs-cta-row">
          <Link to="/economy">
            <Button size="lg" className="gap-2">
              Economy listings <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary">
              Manager dashboard
            </Button>
          </Link>
          <Link to="/about">
            <Button size="lg" variant="secondary">
              About TELOS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
