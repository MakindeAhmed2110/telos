import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, ExternalLink, FileJson, Landmark, Radio, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { HireLogLine, PromptSuccess } from "~/lib/telosApi";
import type { WalletMode } from "~/store";

type Mode = "hiring-log" | "x402";

function formatLogTs(iso: string): string {
  try {
    const d = new Date(iso);
    const base = d.toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${base}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  } catch {
    return iso;
  }
}

function logClass(level: HireLogLine["level"]): string {
  switch (level) {
    case "ok":
      return "dashboard-showcase__log-line--ok";
    case "pay":
      return "dashboard-showcase__log-line--pay";
    case "err":
      return "dashboard-showcase__log-line--err";
    default:
      return "dashboard-showcase__log-line--info";
  }
}

function truncateMiddle(s: string, max = 80): string {
  if (s.length <= max) return s;
  const head = Math.floor(max / 2) - 1;
  const tail = max - head - 1;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function walletModeLabel(mode: WalletMode): string {
  if (mode === "kit") return "Connected wallet (extension prompts)";
  if (mode === "generated") return "Generated testnet key (auto-sign in this tab)";
  return "Connect or generate a wallet";
}

export default function DashboardProtocolShowcase({
  hireLog,
  result,
  walletMode,
}: {
  hireLog: HireLogLine[];
  result: PromptSuccess | null;
  walletMode: WalletMode;
}) {
  const [mode, setMode] = useState<Mode>("hiring-log");

  const tx = result?.settlement?.transaction;
  const txUrl = result?.settlement?.transactionUrl;

  return (
    <section className="dashboard-panel dashboard-showcase" aria-labelledby="dashboard-showcase-heading">
      <div className="dashboard-showcase__head">
        <div>
          <h2 id="dashboard-showcase-heading" className="dashboard-panel__title" style={{ margin: 0 }}>
            Protocol showcase
          </h2>
          <p className="dashboard-showcase__lede font-ui">
            Hiring log lines are emitted from your last run (POST /v1/prompt/plan and the paid specialist HTTP call). x402
            settlement shows fields returned for that run.
          </p>
        </div>
        <div className="dashboard-showcase__toggle" role="group" aria-label="Showcase view">
          <button
            type="button"
            className={`dashboard-showcase__seg ${mode === "hiring-log" ? "dashboard-showcase__seg--on" : ""}`}
            onClick={() => setMode("hiring-log")}
            aria-pressed={mode === "hiring-log"}
          >
            Hiring log
          </button>
          <button
            type="button"
            className={`dashboard-showcase__seg ${mode === "x402" ? "dashboard-showcase__seg--on" : ""}`}
            onClick={() => setMode("x402")}
            aria-pressed={mode === "x402"}
          >
            x402 settlement
          </button>
        </div>
      </div>

      <div className="dashboard-showcase__body">
        <AnimatePresence mode="wait">
          {mode === "hiring-log" ? (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="dashboard-showcase__panel"
            >
              <p className="dashboard-showcase__panel-label font-ui">Live hire trace</p>
              {hireLog.length === 0 ? (
                <p className="dashboard-showcase__empty font-ui">
                  Submit a task — lines appear as the manager plans, the browser calls the specialist, and x402 runs when the
                  route returns HTTP 402.
                </p>
              ) : (
                <pre className="dashboard-showcase__log font-mono" role="log">
                  {hireLog.map((line, idx) => (
                    <span key={`${line.ts}-${idx}`} className={`dashboard-showcase__log-line ${logClass(line.level)}`}>
                      <span className="dashboard-showcase__log-ts">{formatLogTs(line.ts)}</span> {line.msg}
                      {"\n"}
                    </span>
                  ))}
                </pre>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="x402"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="dashboard-showcase__panel dashboard-showcase__panel--x402"
            >
              {!result ? (
                <p className="dashboard-showcase__empty font-ui">
                  Complete a hire successfully to see HTTP status, payTo, and any settlement transaction hash from this
                  session.
                </p>
              ) : (
                <ul className="dashboard-showcase__x402-list">
                  <li>
                    <span className="dashboard-showcase__x402-icon" aria-hidden>
                      <Radio size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="dashboard-showcase__x402-title font-ui">Specialist call</p>
                      <p className="dashboard-showcase__x402-desc font-ui">
                        <span className="font-mono text-[#ffba5c]">{result.method ?? "—"}</span>{" "}
                        <span className="font-mono text-[#b8b8d0] break-all">{truncateMiddle(result.targetUrl ?? "")}</span>
                      </p>
                      {result.httpStatus != null && (
                        <p className="dashboard-showcase__x402-meta font-mono">
                          Final HTTP <span className="text-[#00ff94]">{result.httpStatus}</span>
                          {result.usedX402Payment === false && (
                            <span className="text-[#5c5c78]"> · no 402 on first response (x402 flow skipped)</span>
                          )}
                          {result.usedX402Payment === true && (
                            <span className="text-[#5c5c78]"> · x402 payment + retry</span>
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                  <li>
                    <span className="dashboard-showcase__x402-icon" aria-hidden>
                      <ShieldCheck size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="dashboard-showcase__x402-title font-ui">Signer</p>
                      <p className="dashboard-showcase__x402-desc font-ui">{walletModeLabel(walletMode)}</p>
                    </div>
                  </li>
                  <li>
                    <span className="dashboard-showcase__x402-icon" aria-hidden>
                      <ArrowRightLeft size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="dashboard-showcase__x402-title font-ui">Seller payTo (registry)</p>
                      <p className="dashboard-showcase__x402-desc font-mono break-all text-[#00b4ff]">
                        {result.agent?.payTo ?? "—"}
                      </p>
                    </div>
                  </li>
                  <li>
                    <span className="dashboard-showcase__x402-icon" aria-hidden>
                      <Landmark size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="dashboard-showcase__x402-title font-ui">On-chain settlement</p>
                      {tx ? (
                        <>
                          <p className="dashboard-showcase__x402-desc font-mono break-all text-[#c8c8d8]">{tx}</p>
                          {txUrl ? (
                            <a
                              href={txUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dashboard-showcase__x402-link font-ui inline-flex items-center gap-1 mt-1"
                            >
                              Stellar Expert <ExternalLink size={12} aria-hidden />
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <p className="dashboard-showcase__x402-desc font-ui">
                          {result.usedX402Payment
                            ? "No transaction hash in response headers (check raw JSON below)."
                            : "No x402 settlement for this run (specialist did not require payment)."}
                        </p>
                      )}
                    </div>
                  </li>
                  <li>
                    <span className="dashboard-showcase__x402-icon" aria-hidden>
                      <FileJson size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="dashboard-showcase__x402-title font-ui">Interpreted route</p>
                      <p className="dashboard-showcase__x402-desc font-ui">
                        {result.interpreted?.capability ? (
                          <>
                            Capability <span className="font-mono text-[#ffba5c]">{result.interpreted.capability}</span>
                            {result.interpreted.path ? (
                              <>
                                {" "}
                                · path <span className="font-mono text-[#9898b0]">{result.interpreted.path}</span>
                              </>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </li>
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
