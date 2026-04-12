import { Outlet } from "react-router";
import type { Route } from "./+types/dashboard";
import Button from "~/components/ui/Button";
import { truncateAddress } from "~/lib/utils";
import { useTelosStore } from "~/store";

export const meta: Route.MetaFunction = () => [{ title: "Dashboard — TELOS" }];

export default function Dashboard() {
  const { wallet, walletMode, connectWallet, disconnectWallet, generateWallet } = useTelosStore();

  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <Outlet />
      </main>

      <footer className="dashboard-bottom-bar dashboard-bottom-bar--solo" aria-label="Wallet status">
        <div className="dashboard-bottom-bar__wallet">
          {wallet.connected ? (
            <>
              <span className="dashboard-bottom-bar__status-dot" aria-hidden />
              <span className="dashboard-bottom-bar__status-label">Connected</span>
              <span className="dashboard-bottom-bar__addr">{truncateAddress(wallet.address!)}</span>
              <span className="dashboard-bottom-bar__mode" title="Signing mode">
                {walletMode === "kit" ? "Ext" : "Gen"}
              </span>
              <button
                type="button"
                onClick={() => void disconnectWallet()}
                className="dashboard-bottom-bar__text-btn"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <span className="dashboard-bottom-bar__status-dot dashboard-bottom-bar__status-dot--off" aria-hidden />
              <span className="dashboard-bottom-bar__status-label">No wallet</span>
              <Button size="sm" className="dashboard-bottom-bar__mini-btn" onClick={() => void connectWallet()}>
                Connect
              </Button>
              <Button size="sm" variant="secondary" className="dashboard-bottom-bar__mini-btn" onClick={generateWallet}>
                Generate
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
