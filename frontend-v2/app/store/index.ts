import { create } from "zustand";
import { TRANSACTIONS, type Agent, type Transaction } from "~/data/mockData";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
}

export type WalletMode = "none" | "kit" | "generated";

interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
}

interface TelosStore {
  walletMode: WalletMode;
  /** In-memory only for generated wallets; cleared on disconnect. Never persisted. */
  walletSecret: string | null;
  generateWalletModalOpen: boolean;
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  /** Opens the generate-wallet modal (real Stellar keypair). */
  generateWallet: () => void;
  closeGenerateWalletModal: () => void;
  confirmGeneratedWallet: (publicKey: string, secretKey: string) => void;
  disconnectWallet: () => Promise<void>;

  agents: Agent[];
  myAgents: Agent[];
  deployAgent: (agent: Omit<Agent, "id" | "earnings" | "timesHired" | "rating" | "successRate" | "avgResponse" | "activeSince">) => void;

  transactions: Transaction[];

  toasts: ToastItem[];
  addToast: (type: ToastItem["type"], message: string) => void;
  removeToast: (id: string) => void;

  stats: {
    activeAgents: number;
    transactionsPerHour: number;
    totalVolume: number;
    avgSettlement: number;
  };
  updateStats: () => void;

  portfolioValue: number;
  portfolioChange: number;
}

export const useTelosStore = create<TelosStore>((set, get) => ({
  walletMode: "none",
  walletSecret: null,
  generateWalletModalOpen: false,

  wallet: {
    connected: false,
    address: null,
    balance: 0,
  },

  connectWallet: async () => {
    if (typeof window === "undefined") return;
    try {
      const [{ initStellarWalletsKit }, { StellarWalletsKit }] = await Promise.all([
        import("~/lib/initStellarWalletsKit"),
        import("@creit-tech/stellar-wallets-kit/sdk"),
      ]);
      initStellarWalletsKit();
      const { address } = await StellarWalletsKit.authModal();
      set({
        walletMode: "kit",
        walletSecret: null,
        wallet: { connected: true, address, balance: 0 },
      });
      get().addToast("success", "Wallet connected. Approve x402 payment prompts in your wallet when you send tasks.");
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : String(e);
      const lower = msg.toLowerCase();
      if (lower.includes("cancel") || lower.includes("reject") || lower.includes("closed")) {
        get().addToast("info", "Wallet connection cancelled.");
      } else {
        get().addToast("error", `Could not connect wallet: ${msg}`);
      }
    }
  },

  generateWallet: () => set({ generateWalletModalOpen: true }),

  closeGenerateWalletModal: () => set({ generateWalletModalOpen: false }),

  confirmGeneratedWallet: (publicKey, secretKey) => {
    set({
      walletMode: "generated",
      walletSecret: secretKey,
      generateWalletModalOpen: false,
      wallet: { connected: true, address: publicKey, balance: 0 },
    });
    get().addToast(
      "warning",
      "Generated wallet active — secret stays in this tab only. Fund testnet USDC before paid calls. Use a browser wallet for real use.",
    );
  },

  disconnectWallet: async () => {
    if (typeof window !== "undefined" && get().walletMode === "kit") {
      try {
        const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");
        await StellarWalletsKit.disconnect();
      } catch {
        /* ignore */
      }
    }
    set({
      walletMode: "none",
      walletSecret: null,
      generateWalletModalOpen: false,
      wallet: { connected: false, address: null, balance: 0 },
    });
    get().addToast("info", "Wallet disconnected.");
  },

  agents: [],

  myAgents: [],

  deployAgent: (partial) => {
    const newAgent: Agent = {
      ...partial,
      id: `agt-${Date.now()}`,
      earnings: 0,
      timesHired: 0,
      rating: 0,
      successRate: 0,
      avgResponse: 0,
      activeSince: new Date().toISOString().split("T")[0],
    };
    set((s) => ({
      agents: [...s.agents, newAgent],
      myAgents: [...s.myAgents, newAgent],
    }));
    get().addToast("success", `Agent "${partial.name}" deployed to the network.`);
  },

  transactions: TRANSACTIONS,

  toasts: [],

  addToast: (type, message) => {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, timestamp: Date.now() }] }));
    setTimeout(() => get().removeToast(id), 5500);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  stats: {
    activeAgents: 2847,
    transactionsPerHour: 14302,
    totalVolume: 3200000,
    avgSettlement: 2.8,
  },

  updateStats: () => {
    set((s) => ({
      stats: {
        activeAgents: s.stats.activeAgents + Math.floor(Math.random() * 3 - 1),
        transactionsPerHour: s.stats.transactionsPerHour + Math.floor(Math.random() * 10 - 5),
        totalVolume: s.stats.totalVolume + Math.random() * 100,
        avgSettlement: parseFloat((2.5 + Math.random() * 0.6).toFixed(1)),
      },
    }));
  },

  portfolioValue: 47382.5,
  portfolioChange: 12.4,
}));
