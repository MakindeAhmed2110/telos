import { motion } from "framer-motion";
import { ArrowRight, Bolt, Send, Shield, Terminal } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import Button from "~/components/ui/Button";
import type { HirePhase } from "~/components/ManagerHirePanel";

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  depth?: number;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
          <p className="manager-chat__empty font-ui">Submit a task below — the manager will delegate through the registry and x402.</p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="manager-chat__user-bubble font-ui"
            >
              {m.text}
            </motion.div>
          ) : (
            <motion.article
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="manager-chat__card"
            >
              <p className="manager-chat__card-label">AGENT</p>
              <p className="manager-chat__card-body font-ui">{m.text}</p>
              {m.depth != null && (
                <p className="manager-chat__card-depth font-mono">Depth: {m.depth}</p>
              )}
            </motion.article>
          ),
        )}
        <div ref={bottomRef} />
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
