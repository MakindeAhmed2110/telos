import { motion } from "framer-motion";
import { useState } from "react";
import type { Route } from "./+types/dashboard.settings";
import Button from "~/components/ui/Button";
import Input from "~/components/ui/Input";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Settings — TELOS Dashboard" }];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dashboard-panel dashboard-panel--stack" aria-label={title}>
      <p className="dashboard-panel__title">{title}</p>
      {children}
    </section>
  );
}

export default function DashboardSettings() {
  const { wallet, walletMode, connectWallet, disconnectWallet, generateWallet, addToast } = useTelosStore();
  const [displayName, setDisplayName] = useState("Agent Operator");
  const [notifications, setNotifications] = useState({ txAlerts: true, agentStatus: true, earnings: true });
  const [defaultFee, setDefaultFee] = useState("0.5");

  const handleSave = () => addToast("success", "Settings saved.");

  return (
    <div className="dashboard-page dashboard-page--narrow">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="dashboard-hero__eyebrow">CONFIGURATION</p>
        <h1 className="dashboard-hero__title">Settings</h1>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="dashboard-settings-stack"
      >
        {/* Profile */}
        <Section title="PROFILE">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Agent Operator"
          />
          <Input
            label="Email"
            type="email"
            placeholder="operator@example.com"
          />
        </Section>

        {/* Wallet */}
        <Section title="WALLET">
          {wallet.connected ? (
            <div className="space-y-4">
              <div className="dashboard-wallet-banner">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
                    <span className="font-ui text-[0.6875rem] uppercase tracking-wider text-[#00ff94]">Connected</span>
                  </div>
                  <p className="font-mono text-[0.875rem] text-[#e8e8f0]">{wallet.address}</p>
                  <p className="font-mono text-[0.6875rem] text-[#5c5c78] mt-1">
                    {walletMode === "kit" ? "Connected via Stellar Wallets Kit" : "Generated wallet (secret in session only)"}
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => void disconnectWallet()}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="font-ui font-300 text-[#9898b0] text-[0.875rem]">
                Connect a Stellar wallet to sign x402 payments, or generate a testnet keypair for auto-sign demos.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => void connectWallet()} size="md">
                  Connect wallet
                </Button>
                <Button onClick={generateWallet} size="md" variant="secondary">
                  Generate wallet
                </Button>
              </div>
            </div>
          )}
        </Section>

        {/* Agent defaults */}
        <Section title="AGENT DEFAULTS">
          <Input
            label="Default Fee Rate (%)"
            type="number"
            value={defaultFee}
            onChange={(e) => setDefaultFee(e.target.value)}
            placeholder="0.5"
          />
          <div>
            <p className="font-ui text-[0.6875rem] uppercase tracking-[0.15em] text-[#5c5c78] mb-3">
              Default Capabilities
            </p>
            <div className="flex flex-wrap gap-2">
              {["Trading", "Analytics", "Negotiation", "Reporting"].map((cap) => (
                <button
                  key={cap}
                  className="px-3 py-1.5 rounded-lg font-ui text-[0.75rem] text-[#9898b0] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          {[
            { key: "txAlerts" as const, label: "Transaction Alerts", desc: "Get notified for each transaction" },
            { key: "agentStatus" as const, label: "Agent Status Changes", desc: "Alerts when agents go online/offline" },
            { key: "earnings" as const, label: "Earnings Reports", desc: "Daily earnings summary" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div>
                <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">{n.label}</p>
                <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                className="relative w-10 h-5 rounded-full transition-colors duration-200"
                style={{ background: notifications[n.key] ? "rgba(255,107,0,0.5)" : "rgba(58,58,82,0.8)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: `translateX(${notifications[n.key] ? "20px" : "2px"})` }}
                />
              </button>
            </div>
          ))}
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">Terminate All Agents</p>
              <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">Stop and remove all deployed agents</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => addToast("warning", "Terminate all agents? This action cannot be undone.")}
            >
              Terminate All
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui font-500 text-[0.875rem] text-[#e8e8f0]">Delete Account</p>
              <p className="font-ui font-300 text-[0.75rem] text-[#5c5c78]">Permanently remove your TELOS account</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => addToast("error", "Account deletion is permanent and irreversible.")}
            >
              Delete
            </Button>
          </div>
        </Section>

        <div className="dashboard-settings-actions">
          <Button size="md" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
