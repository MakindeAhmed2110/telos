import { createEd25519Signer } from "@x402/stellar";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/dashboard._index";
import A2ATopology from "~/components/A2ATopology";
import DashboardProtocolShowcase from "~/components/DashboardProtocolShowcase";
import Button from "~/components/ui/Button";
import ManagerChatPanel, { type ChatMessage } from "~/components/ManagerChatPanel";
import ManagerHirePanel, { type HirePhase } from "~/components/ManagerHirePanel";
import { getStellarCaip2Network, getStellarNetworkPassphrase } from "~/lib/stellarConfig";
import {
  fetchRegistryAgents,
  formatAgentPriceLabel,
  getManagerBaseUrl,
  pathQueryFromTargetUrl,
  runManagerPromptWithClientSigner,
  type HireLogLine,
  type PromptSuccess,
  type RegistryAgentRecord,
} from "~/lib/telosApi";
import { createWalletsKitClientSigner } from "~/lib/walletSigners";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Manager — TELOS Dashboard" }];

export default function DashboardIndex() {
  const { wallet, walletMode, walletSecret, connectWallet, generateWallet } = useTelosStore();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<HirePhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [result, setResult] = useState<PromptSuccess | null>(null);
  const [hireLog, setHireLog] = useState<HireLogLine[]>([]);
  const [capability, setCapability] = useState<string | undefined>();
  const [path, setPath] = useState<string | undefined>();
  const [specialistId, setSpecialistId] = useState<string | undefined>();
  const [transactionUrl, setTransactionUrl] = useState<string | undefined>();
  const [agents, setAgents] = useState<RegistryAgentRecord[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const runIdRef = useRef(0);
  const loggedPhasesRef = useRef(new Set<string>());

  const appendHireLog = useCallback((line: HireLogLine) => {
    setHireLog((prev) => [...prev, line]);
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const list = await fetchRegistryAgents();
      setAgents(list);
      setAgentsError(null);
    } catch {
      setAgents([]);
      setAgentsError("offline");
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (phase === "idle") return;
    const key = `${runIdRef.current}:${phase}`;
    if (loggedPhasesRef.current.has(key)) return;
    loggedPhasesRef.current.add(key);

    const push = (text: string, depth?: number) => {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "agent", text, depth }]);
    };

    switch (phase) {
      case "plan":
        push("Manager agent is interpreting your task and selecting a capability route.", 1);
        break;
      case "registry":
        push(
          "Delegating to telos-registry — each capability maps to a real HTTP route on the specialist (e.g. GET /weather/…, POST /math/…).",
          2,
        );
        break;
      case "pay":
        push(
          walletMode === "kit"
            ? "x402: approve Soroban auth / payment in your connected wallet (Freighter, etc.)."
            : "x402: signing payment automatically with your generated key in this browser.",
          3,
        );
        break;
      case "settle":
        break;
      case "done":
        break;
      default:
        break;
    }
  }, [phase, walletMode]);

  const runTask = async () => {
    const text = prompt.trim();
    if (!text) return;

    runIdRef.current += 1;
    loggedPhasesRef.current.clear();

    setErrorMessage(undefined);
    setResult(null);
    setHireLog([]);
    setCapability(undefined);
    setPath(undefined);
    setSpecialistId(undefined);
    setTransactionUrl(undefined);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setPhase("plan");

    const tReg = window.setTimeout(() => setPhase("registry"), 450);
    const tPay = window.setTimeout(() => setPhase("pay"), 950);

    try {
      if (!wallet.connected || !wallet.address) {
        throw new Error("Connect or generate a wallet first.");
      }
      let out: PromptSuccess;
      if (walletMode === "generated") {
        if (!walletSecret) throw new Error("Generated wallet secret missing. Disconnect and generate again.");
        const signer = createEd25519Signer(walletSecret, getStellarCaip2Network());
        out = await runManagerPromptWithClientSigner(text, signer, { onHireLog: appendHireLog });
      } else if (walletMode === "kit") {
        const signer = createWalletsKitClientSigner(wallet.address, getStellarNetworkPassphrase());
        out = await runManagerPromptWithClientSigner(text, signer, { onHireLog: appendHireLog });
      } else {
        throw new Error("Connect a Stellar wallet or generate one to pay x402 from the browser.");
      }
      window.clearTimeout(tReg);
      window.clearTimeout(tPay);
      setPhase("settle");
      setResult(out);
      setCapability(out.interpreted?.capability);
      setPath(out.interpreted?.path);
      setSpecialistId(out.agent?.id);
      setTransactionUrl(out.settlement?.transactionUrl);

      const pq = pathQueryFromTargetUrl(out.targetUrl);
      const rawPath = out.interpreted?.path?.trim();
      const pathQuery =
        pq !== "/"
          ? pq
          : rawPath
            ? rawPath.startsWith("/")
              ? rawPath
              : `/${rawPath}`
            : "/";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "Registry row resolved — the paid hire hits this HTTP route on the specialist:",
          format: "hire",
          method: out.method ?? "GET",
          pathQuery,
          specialistId: out.agent?.id,
          capability: out.interpreted?.capability,
          baseUrl: out.agent?.baseUrl,
          payTo: out.agent?.payTo,
        },
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "How the browser pays (x402):",
          format: "payment",
          walletMode: walletMode === "kit" ? "kit" : "generated",
        },
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "Specialist responded — settlement credits their payTo on Stellar.",
          format: "paid",
          httpStatus: out.httpStatus,
          transactionUrl: out.settlement?.transactionUrl,
          transaction: out.settlement?.transaction,
          payTo: out.agent?.payTo,
          specialistId: out.agent?.id,
        },
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "Full manager result payload (same as dashboard raw panel):",
          format: "raw",
          rawBody: JSON.stringify(out, null, 2),
        },
      ]);

      window.setTimeout(() => setPhase("done"), 700);
    } catch (e) {
      window.clearTimeout(tReg);
      window.clearTimeout(tPay);
      const errText = e instanceof Error ? e.message : "Request failed";
      appendHireLog({ ts: new Date().toISOString(), level: "err", msg: errText });
      setPhase("error");
      setErrorMessage(errText);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "",
          format: "raw",
          rawBody: errText,
        },
      ]);
    }
  };

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  return (
    <div className="dashboard-page">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="dashboard-hero__eyebrow">MANAGER</p>
        <h1 className="dashboard-hero__title dashboard-hero__title--xl">Task your personal agent</h1>
        <p className="dashboard-hero__lede">
          The manager plans your task (telos-registry). <strong className="text-[#e8e8f0] font-500">You</strong> pay the
          specialist via x402 from this browser — wallet extension signs each payment, or a generated key signs
          automatically (testnet demo only). API:{" "}
          <span className="font-mono text-[#9898b0] text-xs">{getManagerBaseUrl()}</span>.
        </p>
      </motion.header>

      {!wallet.connected && (
        <div className="dashboard-alert" role="status">
          <p className="font-ui text-sm text-[#9898b0] flex-1 min-w-[200px]" style={{ margin: 0 }}>
            Connect a Stellar wallet (x402 prompts in the extension) or generate a testnet keypair (auto-sign in this tab
            only).
          </p>
          <Button size="sm" onClick={() => void connectWallet()}>
            Connect
          </Button>
          <Button size="sm" variant="secondary" onClick={generateWallet}>
            Generate wallet
          </Button>
        </div>
      )}

      <div className="dashboard-split dashboard-split--manager">
        <div className="min-w-0 dashboard-manager-column">
          <ManagerChatPanel
            messages={messages}
            prompt={prompt}
            setPrompt={setPrompt}
            onSend={() => void runTask()}
            busy={busy}
            phase={phase}
          />

          <DashboardProtocolShowcase hireLog={hireLog} result={result} walletMode={walletMode} />

          <div className="dashboard-panel dashboard-panel--economy">
            <div className="dashboard-panel__head">
              <p className="dashboard-panel__title" style={{ margin: 0 }}>
                Economy · pay-per-call
              </p>
              <button
                type="button"
                onClick={() => void loadAgents()}
                className="font-mono text-[0.625rem] text-[#ffba5c] hover:underline bg-transparent border-0 p-0 cursor-pointer"
              >
                refresh
              </button>
            </div>
            {agentsError && (
              <div className="flex items-start gap-2 text-[#ffba5c] mb-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden />
                <p className="font-ui text-xs text-[#9898b0]" style={{ margin: 0 }}>
                  Registry unreachable — start telos-registry (and check{" "}
                  <span className="font-mono">VITE_TELOS_REGISTRY_URL</span>) to load live prices.
                </p>
              </div>
            )}
            <div className="dashboard-economy-grid" role="list">
              {agents.length === 0 && !agentsError && (
                <div className="dashboard-economy-empty font-ui text-xs text-[#5c5c78] leading-relaxed" role="status">
                  <span className="block text-[#9898b0] mb-1">Registry returned no rows.</span>
                  <span className="block">
                    Start <span className="font-mono text-[#b8b8d0]">telos-registry</span>, then in{" "}
                    <span className="font-mono text-[#b8b8d0]">telos-agents</span> run{" "}
                    <span className="font-mono text-[#b8b8d0]">pnpm register:agents</span>.{" "}
                    <Link to="/economy" className="text-[#ffba5c] hover:underline">
                      Economy
                    </Link>{" "}
                    ·{" "}
                    <Link to="/how-it-works" className="text-[#ffba5c] hover:underline">
                      Docs
                    </Link>
                  </span>
                </div>
              )}
              {agents.map((a, i) => (
                <motion.div
                  key={a.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="dashboard-economy-card"
                >
                  <div className="min-w-0">
                    <p className="dashboard-economy-card__title">{a.name}</p>
                    <p className="dashboard-economy-card__id">{a.id}</p>
                  </div>
                  <motion.span
                    className="dashboard-economy-card__pill"
                    animate={{ opacity: [1, 0.72, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
                  >
                    {formatAgentPriceLabel(a)}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>

          {(result !== null || phase === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard-panel dashboard-panel--dark overflow-x-auto"
            >
              <p className="font-ui font-600 text-xs uppercase tracking-wider text-[#5c5c78]" style={{ margin: "0 0 0.5rem" }}>
                Raw response
              </p>
              <pre className="dashboard-pre-block">
                {phase === "error" ? errorMessage : JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>

        <aside className="dashboard-aside-stack">
          <A2ATopology agents={agents} phase={phase} activeAgentId={specialistId} />

          <ManagerHirePanel
            phase={phase}
            errorMessage={errorMessage}
            capability={capability}
            path={path}
            specialistId={specialistId}
            transactionUrl={transactionUrl}
          />
        </aside>
      </div>
    </div>
  );
}
