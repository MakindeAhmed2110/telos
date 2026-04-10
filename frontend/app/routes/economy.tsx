import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Copy, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/economy";
import Button from "~/components/ui/Button";
import EconomyAgentMesh from "~/components/EconomyAgentMesh";
import {
  fetchRegistryAgents,
  formatAgentPriceLabel,
  getAgentHireLink,
  getRegistryBaseUrl,
  REGISTRY_USDC_PRICE_HELP,
  type RegistryAgentRecord,
} from "~/lib/telosApi";

export const meta: Route.MetaFunction = () => [
  { title: "Economy — TELOS" },
  {
    name: "description",
    content: "Agents registered in telos-registry — capabilities, endpoints, and suggested x402 pricing.",
  },
];

export default function Economy() {
  const [agents, setAgents] = useState<RegistryAgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyHireUrl = useCallback(async (agentId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(agentId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRegistryAgents();
      setAgents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(`agent-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [agents]);

  return (
    <div className="economy-page">
      <div className="economy-page__inner">
        <header className="economy-page__hero">
          <p className="economy-page__eyebrow font-ui font-600 text-[0.625rem] uppercase tracking-[0.2em] text-[#ff9500]">
            LIVE REGISTRY
          </p>
          <h1
            className="economy-page__title font-display italic text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Agent economy
          </h1>
          <p className="economy-page__lede font-ui font-light text-[0.9375rem] text-[#9898b0]">
            Listings load from <span className="text-[#e8e8f0]">GET /v1/agents</span> on telos-registry (
            <span className="font-mono text-[0.8rem] text-[#5c5c78]">{getRegistryBaseUrl()}</span>
            ) — one browser hop, same data the manager proxies. Run the registry locally to populate this view.
          </p>
          <div className="economy-page__actions">
            <Button size="md" variant="secondary" className="gap-2" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Link to="/dashboard">
              <Button size="md" className="gap-2">
                Open dashboard <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="md" variant="ghost" className="gap-2 text-[#9898b0]">
                Register an agent
              </Button>
            </Link>
          </div>
        </header>

        <section aria-labelledby="prices-heading" className="economy-page__section">
          <h2 id="prices-heading" className="sr-only">
            Suggested prices
          </h2>
          <div className="economy-ticker">
            <div className="economy-ticker__head">
              <div>
                <p
                  className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.12em] text-[#b794ff]"
                  style={{ margin: 0 }}
                >
                  Economy ticker · pay-per-call (USDC)
                </p>
                <p className="economy-ticker__help font-ui" title={REGISTRY_USDC_PRICE_HELP}>
                  {REGISTRY_USDC_PRICE_HELP}
                </p>
              </div>
              <span className="font-mono text-[0.625rem] text-[#5c5c78] economy-ticker__count">
                {agents.length} agents
              </span>
            </div>
            <div className="economy-ticker__body">
              {agents.length === 0 && !loading ? (
                <p className="economy-ticker__empty font-ui">
                  0 agents in registry — run telos-registry, then <span className="font-mono">pnpm register:agents</span> in
                  telos-agents.
                </p>
              ) : (
                <motion.div
                  className="economy-ticker__track font-mono text-[0.8125rem]"
                  animate={{ x: agents.length > 1 ? [0, "-45%"] : 0 }}
                  transition={{
                    duration: agents.length > 1 ? 28 : 0,
                    repeat: agents.length > 1 ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  {[...agents, ...agents].map((a, i) => (
                    <span key={`${a.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="text-[#e8e8f0]">{a.id}</span>
                      <span className="text-[#ffba5c]">{formatAgentPriceLabel(a)}</span>
                      <span className="text-[#5c5c78]">·</span>
                      <span className="text-[#5c5c78]" style={{ maxWidth: "12.5rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.capabilities[0] ?? "—"}
                      </span>
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="economy-alert" role="alert">
            <AlertCircle className="text-[#ffba5c]" style={{ flexShrink: 0, marginTop: "0.125rem" }} size={18} />
            <div>
              <p className="font-ui font-600 text-[#ffba5c] text-sm" style={{ margin: 0 }}>
                Could not reach registry
              </p>
              <p className="font-mono text-[0.75rem] text-[#9898b0]" style={{ margin: "0.5rem 0 0" }}>
                {error}
              </p>
              <p className="font-ui text-[0.8125rem] text-[#9898b0]" style={{ margin: "0.75rem 0 0" }}>
                Start <span className="font-mono">telos-registry</span> on{" "}
                <span className="font-mono">{getRegistryBaseUrl()}</span> or set{" "}
                <span className="font-mono">VITE_TELOS_REGISTRY_URL</span> in <span className="font-mono">frontend/.env</span>.
              </p>
            </div>
          </div>
        )}

        {agents.length === 0 && !loading && !error && (
          <div className="economy-empty-hint font-ui" role="note">
            <p style={{ margin: 0 }}>
              <strong>Refresh works — the list is empty.</strong> This page reads{" "}
              <span className="font-mono">GET /v1/agents</span> on telos-registry. Running{" "}
              <span className="font-mono">telos-agents</span> alone does not create registry rows.
            </p>
            <ol>
              <li>
                Run <span className="font-mono">pnpm dev</span> in <span className="font-mono">telos-registry/</span> (default
                port 4010, must match <span className="font-mono">{getRegistryBaseUrl()}</span>).
              </li>
              <li>
                In <span className="font-mono">telos-agents/</span>, set <span className="font-mono">REGISTRY_URL</span>,{" "}
                <span className="font-mono">AGENTS_PUBLIC_BASE_URL</span>, and valid <span className="font-mono">PAY_TO_*</span>{" "}
                keys, then run <span className="font-mono">pnpm register:agents</span>.
              </li>
              <li>
                Click Refresh — or register manually via{" "}
                <Link to="/how-it-works" className="text-[#ffba5c]">
                  How it works
                </Link>
                .
              </li>
            </ol>
          </div>
        )}

        <section className="economy-page__section" aria-label="Registry agents">
          <EconomyAgentMesh agentCount={loading && agents.length === 0 ? 0 : agents.length}>
            {loading && agents.length === 0 ? (
              <ul className="economy-mesh__grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="economy-skeleton" />
                ))}
              </ul>
            ) : (
              <ul className="economy-mesh__grid">
                {agents.map((a, idx) => {
                  const hire = getAgentHireLink(a);
                  return (
                  <motion.li
                    key={a.id}
                    id={`agent-${a.id}`}
                    data-economy-node={a.id}
                    className="economy-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(idx * 0.018, 0.1),
                      type: "spring",
                      stiffness: 200,
                      damping: 26,
                    }}
                  >
                    <div className="economy-card__top">
                      <div className="economy-card__intro">
                        <h3
                          className="economy-card__title font-ui font-600 text-lg text-[#e8e8f0]"
                          style={{ margin: 0 }}
                        >
                          {a.name}
                        </h3>
                        <p
                          className="economy-card__id font-mono text-[0.6875rem] text-[#5c5c78]"
                          style={{ margin: "0.25rem 0 0" }}
                        >
                          {a.id}
                        </p>
                      </div>
                      <motion.div
                        layout
                        className="economy-card__price font-mono text-sm"
                        style={{
                          flexShrink: 0,
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.5rem",
                          background: "rgba(255,186,92,0.12)",
                          border: "1px solid rgba(255,186,92,0.35)",
                          color: "#ffba5c",
                        }}
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1 + idx * 0.2 }}
                      >
                        {formatAgentPriceLabel(a)}
                      </motion.div>
                    </div>
                    {a.description && (
                      <p
                        className="font-ui font-300 text-[0.875rem] text-[#9898b0] leading-relaxed"
                        style={{ margin: 0 }}
                      >
                        {a.description}
                      </p>
                    )}
                    <div className="economy-card__chips">
                      {a.capabilities.map((c) => (
                        <span
                          key={c}
                          className="font-mono text-[0.625rem]"
                          style={{
                            padding: "0.125rem 0.5rem",
                            borderRadius: "0.375rem",
                            background: "rgba(0,180,255,0.1)",
                            color: "#7fdbff",
                            border: "1px solid rgba(0,180,255,0.2)",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="economy-card__hire">
                      <div className="economy-card__hire-head">
                        <span className="economy-card__hire-label font-ui text-[0.6875rem] text-[#9898b0]">
                          Hire URL
                        </span>
                        <span className="economy-card__hire-method font-mono text-[0.625rem] text-[#7fdbff]">
                          {hire.method}
                        </span>
                      </div>
                      <div className="economy-card__hire-row">
                        <code className="economy-card__hire-url">{hire.url}</code>
                        <button
                          type="button"
                          className="economy-card__hire-copy"
                          aria-label="Copy hire URL"
                          onClick={() => void copyHireUrl(a.id, hire.url)}
                        >
                          {copiedId === a.id ? (
                            <Check className="economy-card__hire-copy-icon" aria-hidden />
                          ) : (
                            <Copy className="economy-card__hire-copy-icon" aria-hidden />
                          )}
                        </button>
                      </div>
                      {hire.isBaseOnly ? (
                        <p className="economy-card__hire-note font-ui text-[0.625rem] text-[#5c5c78]">
                          No known path for these capabilities — use this base URL and the agent’s API docs.
                        </p>
                      ) : (
                        <p className="economy-card__hire-note font-ui text-[0.625rem] text-[#5c5c78]">
                          x402: another agent or client calls this URL and completes payment after HTTP 402.
                        </p>
                      )}
                    </div>
                    <p className="economy-card__meta" style={{ margin: 0 }}>
                      {a.baseUrl}
                      <span style={{ color: "#3a3a52" }}> · payTo </span>
                      <span style={{ color: "#9898b0" }}>
                        {a.payTo.slice(0, 12)}…{a.payTo.slice(-6)}
                      </span>
                    </p>
                  </motion.li>
                  );
                })}
              </ul>
            )}
          </EconomyAgentMesh>
        </section>
      </div>
    </div>
  );
}
