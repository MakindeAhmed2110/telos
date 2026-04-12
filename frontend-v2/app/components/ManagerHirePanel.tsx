import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Brain,
  CheckCircle2,
  Circle,
  Database,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";

export type HirePhase = "idle" | "plan" | "registry" | "pay" | "settle" | "done" | "error";

const STEPS: { key: Exclude<HirePhase, "idle" | "done" | "error">; label: string; detail: string; Icon: typeof Brain }[] = [
  { key: "plan", label: "Interpret task", detail: "Manager plans capability and path from your prompt (planner when configured on server).", Icon: Brain },
  { key: "registry", label: "Resolve agent", detail: "Manager reads telos-registry for baseUrl + payTo.", Icon: Database },
  { key: "pay", label: "x402 hire", detail: "Paid HTTP to the specialist; facilitator handles the quote.", Icon: Wallet },
  { key: "settle", label: "Paid on Stellar", detail: "Settlement hits the agent payTo account on ledger.", Icon: Sparkles },
];

function stepCursor(p: HirePhase): number {
  switch (p) {
    case "plan":
      return 0;
    case "registry":
      return 1;
    case "pay":
      return 2;
    case "settle":
      return 3;
    case "done":
      return 4;
    default:
      return -1;
  }
}

export default function ManagerHirePanel({
  phase,
  errorMessage,
  capability,
  path,
  specialistId,
  transactionUrl,
}: {
  phase: HirePhase;
  errorMessage?: string;
  capability?: string;
  path?: string;
  specialistId?: string;
  transactionUrl?: string;
}) {
  const cur = stepCursor(phase);

  return (
    <div className="dashboard-hire-panel">
      <div className="flex items-center gap-2 mb-1">
        <Bot size={18} className="text-[#ff9500]" strokeWidth={1.5} />
        <p className="font-ui font-600 text-[0.6875rem] uppercase tracking-[0.15em] text-[#ffba5c]">
          Your manager agent
        </p>
      </div>
      <p className="font-ui font-300 text-[0.8125rem] text-[#5c5c78] leading-relaxed mb-6">
        This is how Telos routes your task to a specialist and moves money on-chain.
      </p>

      <ul className="space-y-0 flex-1">
        {STEPS.map((step, idx) => {
          const done = phase === "done" || cur > idx;
          const current = phase !== "error" && phase !== "idle" && phase !== "done" && cur === idx;

          return (
            <motion.li
              key={step.key}
              initial={false}
              animate={{ opacity: 1 }}
              className="flex gap-3 pb-5 last:pb-0 border-b border-[rgba(255,255,255,0.05)] last:border-0"
            >
              <div className="pt-0.5 shrink-0">
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span
                      key="ok"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CheckCircle2 size={20} className="text-[#00ff94]" />
                    </motion.span>
                  ) : current ? (
                    <motion.span
                      key="load"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    >
                      <Loader2 size={20} className="text-[#ffba5c]" />
                    </motion.span>
                  ) : (
                    <Circle size={20} className="text-[#3a3a52]" />
                  )}
                </AnimatePresence>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <step.Icon size={14} className="text-[#7b2fff] shrink-0 opacity-80" />
                  <span
                    className="font-ui font-600 text-[0.8125rem]"
                    style={{ color: done || current ? "#e8e8f0" : "#5c5c78" }}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="font-ui font-300 text-[0.7rem] text-[#5c5c78] mt-1 leading-relaxed">{step.detail}</p>
                {step.key === "registry" && (capability || specialistId) && (done || current) && (
                  <p className="font-mono text-[0.625rem] text-[#00b4ff] mt-2 break-all">
                    {specialistId && <span className="text-[#9898b0]">agent </span>}
                    {specialistId}
                    {capability && (
                      <>
                        {" "}
                        · <span className="text-[#ffba5c]">{capability}</span>
                      </>
                    )}
                    {path && (
                      <>
                        {" "}
                        <span className="text-[#5c5c78]">{path}</span>
                      </>
                    )}
                  </p>
                )}
                {step.key === "settle" && transactionUrl && done && (
                  <a
                    href={transactionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 font-ui text-[0.6875rem] text-[#ffba5c] hover:underline"
                  >
                    View on Stellar Expert →
                  </a>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>
        {phase === "error" && errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 font-mono text-[0.6875rem] text-[#ff6b6b] bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.2)] rounded-lg px-3 py-2"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <p className="mt-4 font-ui text-[0.6875rem] text-[#5c5c78] text-center">
          Submit a task to watch the hire sequence.
        </p>
      )}
    </div>
  );
}
