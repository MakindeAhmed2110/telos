import { ArrowRight, Bolt, CheckCircle2, ExternalLink, Send, Shield, Terminal } from "lucide-react";
import { Link } from "react-router";
import Button from "~/components/ui/Button";
import type { HirePhase } from "~/components/ManagerHirePanel";

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  depth?: number;
  /** Structured pipeline row (hire route, x402, settlement) or raw JSON */
  format?: "plain" | "hire" | "payment" | "paid" | "raw";
  /** Preformatted JSON or error text */
  rawBody?: string;
  method?: string;
  /** Path + query starting with `/` */
  pathQuery?: string;
  payTo?: string;
  transactionUrl?: string;
  transaction?: string;
  specialistId?: string;
  capability?: string;
  baseUrl?: string;
  httpStatus?: number;
  walletMode?: "kit" | "generated";
};

function statusLabel(phase: HirePhase): string {
  if (phase === "idle" || phase === "done" || phase === "error") return "STANDBY";
  return "ROUTING";
}

export default function ManagerChatPanel({
  messages,
  prompt,
  setPrompt,
  onSend,
  busy,
  phase,
}: {
  messages: ChatMessage[];
  prompt: string;
  setPrompt: (v: string) => void;
  onSend: () => void;
  busy: boolean;
  phase: HirePhase;
}) {
  return (
    <div className="manager-chat">
      <header className="manager-chat__header">
        <div className="manager-chat__brand">
          <div className="manager-chat__icon" aria-hidden>
            <Terminal size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="manager-chat__title">MANAGER AGENT</p>
            <p className="manager-chat__status">
              <span className="manager-chat__status-dot" data-live={busy ? "true" : "false"} />
              {statusLabel(phase)}
            </p>
          </div>
        </div>
        <div className="manager-chat__badges">
          <span className="manager-chat__pill">
            <Shield size={12} aria-hidden /> SECURE
          </span>
          <span className="manager-chat__pill">
            <Bolt size={12} aria-hidden /> FAST
          </span>
        </div>
      </header>

      <div className="manager-chat__feed" role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="manager-chat__empty font-ui">
            Submit a task below — the manager resolves a specialist via telos-registry, calls a concrete{" "}
            <span className="font-mono text-[#9898b0]">GET /…</span> or <span className="font-mono text-[#9898b0]">POST /…</span>{" "}
            route on their baseUrl, pays with x402 (HTTP 402 → wallet signs USDC), then the specialist&apos;s{" "}
            <span className="text-[#9898b0]">payTo</span> is credited on Stellar.
          </p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="manager-chat__user-bubble font-ui">
              {m.text}
            </div>
          ) : m.format === "raw" ? (
            <article key={m.id} className="manager-chat__card manager-chat__card--raw">
              <p className="manager-chat__card-label">RAW RESPONSE</p>
              {m.text.trim() ? (
                <p className="manager-chat__card-body font-ui manager-chat__raw-intro">{m.text}</p>
              ) : null}
              <pre className="manager-chat__raw-pre font-mono">{m.rawBody ?? ""}</pre>
            </article>
          ) : m.format === "hire" ? (
            <article key={m.id} className="manager-chat__card manager-chat__card--pipeline">
              <p className="manager-chat__card-label">① HIRE · PAID HTTP TO SPECIALIST</p>
              <p className="manager-chat__card-body font-ui">{m.text}</p>
              <p className="manager-chat__route-line font-mono">
                <span className="manager-chat__route-verb">{m.method ?? "GET"}</span> {m.pathQuery ?? "/"}
              </p>
              {(m.specialistId || m.capability) && (
                <ul className="manager-chat__meta-list font-ui">
                  {m.specialistId && (
                    <li>
                      <span className="manager-chat__meta-k">Registry id</span>{" "}
                      <span className="font-mono text-[#b8b8d0]">{m.specialistId}</span>
                    </li>
                  )}
                  {m.capability && (
                    <li>
                      <span className="manager-chat__meta-k">Capability</span>{" "}
                      <span className="font-mono text-[#b8b8d0]">{m.capability}</span>
                    </li>
                  )}
                  {m.baseUrl && (
                    <li className="break-all">
                      <span className="manager-chat__meta-k">baseUrl</span>{" "}
                      <span className="font-mono text-[#7b9ab0] text-[0.65rem]">{m.baseUrl}</span>
                    </li>
                  )}
                  {m.payTo && (
                    <li className="break-all">
                      <span className="manager-chat__meta-k">payTo (fees)</span>{" "}
                      <span className="font-mono text-[#00b4ff] text-[0.65rem]">{m.payTo}</span>
                    </li>
                  )}
                </ul>
              )}
            </article>
          ) : m.format === "payment" ? (
            <article key={m.id} className="manager-chat__card manager-chat__card--pipeline">
              <p className="manager-chat__card-label">② PAYMENT · X402</p>
              <p className="manager-chat__card-body font-ui">{m.text}</p>
              <ol className="manager-chat__steps font-ui">
                <li>
                  First request hits the specialist URL → server responds with <span className="font-mono">402 Payment Required</span>{" "}
                  (amount &amp; asset in response body / headers).
                </li>
                <li>
                  Your wallet builds a Stellar USDC payment;{" "}
                  {m.walletMode === "kit"
                    ? "the extension prompts you to sign (Freighter, etc.)."
                    : "this tab signs automatically with your generated testnet key."}
                </li>
                <li>
                  Client retries the same <span className="font-mono">GET/POST</span> with an x402{" "}
                  <span className="font-mono text-[#ffba5c]">PAYMENT-SIGNATURE</span> header so the agent can verify and respond.
                </li>
              </ol>
            </article>
          ) : m.format === "paid" ? (
            <article key={m.id} className="manager-chat__card manager-chat__card--pipeline manager-chat__card--paid">
              <p className="manager-chat__card-label manager-chat__card-label--success">
                <CheckCircle2 size={14} className="inline-block mr-1 align-text-bottom" aria-hidden />③ SPECIALIST PAID · SETTLED
              </p>
              <p className="manager-chat__card-body font-ui">{m.text}</p>
              <div className="manager-chat__paid-grid font-ui">
                {m.httpStatus != null && (
                  <p className="manager-chat__paid-row">
                    <span className="manager-chat__meta-k">Response</span>{" "}
                    <span className="font-mono text-[#00ff94]">HTTP {m.httpStatus}</span>
                  </p>
                )}
                {m.specialistId && (
                  <p className="manager-chat__paid-row">
                    <span className="manager-chat__meta-k">Earned by</span>{" "}
                    <span className="font-mono text-[#e8e8f0]">{m.specialistId}</span>
                  </p>
                )}
                {m.payTo && (
                  <p className="manager-chat__paid-row break-all">
                    <span className="manager-chat__meta-k">payTo</span>{" "}
                    <span className="font-mono text-[#00b4ff] text-[0.7rem]">{m.payTo}</span>
                  </p>
                )}
                {m.transactionUrl ? (
                  <a
                    href={m.transactionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="manager-chat__tx-link font-ui"
                  >
                    View settlement on Stellar Expert <ExternalLink size={12} className="inline ml-1" aria-hidden />
                  </a>
                ) : m.transaction ? (
                  <p className="font-mono text-[0.65rem] text-[#5c5c78] break-all">tx: {m.transaction}</p>
                ) : (
                  <p className="font-ui text-[0.75rem] text-[#5c5c78]">Settlement recorded — see raw JSON in this thread.</p>
                )}
              </div>
            </article>
          ) : (
            <article key={m.id} className="manager-chat__card">
              <p className="manager-chat__card-label">AGENT</p>
              <p className="manager-chat__card-body font-ui">{m.text}</p>
              {m.depth != null && (
                <p className="manager-chat__card-depth font-mono">Depth: {m.depth}</p>
              )}
            </article>
          ),
        )}
      </div>

      <div className="manager-chat__composer">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && prompt.trim()) onSend();
            }
          }}
          disabled={busy}
          placeholder="Ask the manager to hire a specialist…"
          className="manager-chat__input font-ui"
          aria-label="Task prompt"
        />
        <button
          type="button"
          className="manager-chat__send"
          disabled={busy || !prompt.trim()}
          onClick={onSend}
          aria-label="Send task"
        >
          <Send size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="manager-chat__footer-actions">
        <Link to="/economy" className="manager-chat__economy-link">
          <Button size="md" variant="secondary" className="gap-2 manager-chat__economy-btn">
            Browse economy <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
