import type { ClientStellarSigner } from "@x402/stellar";

/** Browser → telos-manager (CORS enabled). Override in `.env`: VITE_TELOS_MANAGER_URL */
export function getManagerBaseUrl(): string {
  const raw = import.meta.env.VITE_TELOS_MANAGER_URL as string | undefined;
  return (raw ?? "http://localhost:4020").replace(/\/+$/, "");
}

/**
 * Browser → telos-registry for read-only listings (CORS enabled in telos-registry).
 * Defaults to `http://localhost:4010` — same as manager’s `REGISTRY_URL` — so the economy page skips the
 * manager proxy hop (`/v1/registry/agents`). Override with `VITE_TELOS_REGISTRY_URL` if your registry
 * is on another host.
 */
export function getRegistryBaseUrl(): string {
  const raw = import.meta.env.VITE_TELOS_REGISTRY_URL as string | undefined;
  return (raw?.trim() ? raw : "http://localhost:4010").replace(/\/+$/, "");
}

export type RegistryAgentRecord = {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  baseUrl: string;
  payTo: string;
  suggestedPrice?: string;
  network?: string;
  registeredAt?: string;
  updatedAt?: string;
};

/**
 * x402 paid calls settle in USDC on Stellar in this stack. `suggestedPrice` on the registry row is an optional,
 * non-binding hint from the agent author (e.g. "0.01"). The amount you actually pay is defined by the agent’s
 * HTTP 402 Payment Required response — not by this string.
 */
export const REGISTRY_USDC_PRICE_HELP =
  "Payments are in USDC on Stellar (x402). The number here is an optional registry guide only; the exact charge is in the HTTP 402 response when you call the agent.";

/** Compact label for tickers and badges (includes currency). */
export function formatAgentPriceLabel(a: RegistryAgentRecord): string {
  const hint = a.suggestedPrice?.trim();
  if (hint) return `${hint} USDC · guide`;
  return "USDC · 402 sets amount";
}

/** Paths match `telos-agents` `agentRouter()` (testnet demo routes). */
const CAPABILITY_HIRE: Record<string, { path: string; method: "GET" | "POST" }> = {
  weather: { path: "/weather/testnet?city=San+Francisco", method: "GET" },
  math: { path: "/math/testnet", method: "POST" },
  summarization: { path: "/summarize/testnet", method: "POST" },
  crypto_sentiment: { path: "/crypto-sentiment/testnet", method: "POST" },
  deep_research: { path: "/deep-research/testnet", method: "POST" },
  market: { path: "/market/testnet?symbol=BTC", method: "GET" },
  website_builder: { path: "/website-builder/testnet", method: "POST" },
};

export type AgentHireLink = {
  /** Full URL another client or agent can call (x402: expect 402 then pay). */
  url: string;
  method: "GET" | "POST";
  /** True when we only know the agent base URL, not a capability-specific path. */
  isBaseOnly: boolean;
};

/**
 * Best-effort hire URL for registry-listed agents. Known TELOS demo capabilities map to `telos-agents`
 * routes; otherwise callers should use `baseUrl` and the agent’s own docs.
 */
export function getAgentHireLink(a: RegistryAgentRecord): AgentHireLink {
  const base = a.baseUrl.replace(/\/+$/, "");
  for (const cap of a.capabilities) {
    const hit = CAPABILITY_HIRE[cap];
    if (hit) {
      return {
        url: `${base}${hit.path.startsWith("/") ? hit.path : `/${hit.path}`}`,
        method: hit.method,
        isBaseOnly: false,
      };
    }
  }
  return { url: base, method: "GET", isBaseOnly: true };
}

const debugRegistryTiming =
  import.meta.env.DEV &&
  (import.meta.env.VITE_TELOS_DEBUG_TIMING === "1" || import.meta.env.VITE_TELOS_DEBUG_TIMING === "true");

export async function fetchRegistryAgents(): Promise<RegistryAgentRecord[]> {
  const base = getRegistryBaseUrl();
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const r = await fetch(`${base}/v1/agents`, {
    headers: { accept: "application/json" },
  });
  const tAfterHeaders = typeof performance !== "undefined" ? performance.now() : 0;
  if (!r.ok) {
    throw new Error(`registry_unreachable:${r.status}`);
  }
  const j = (await r.json()) as { agents?: RegistryAgentRecord[] };
  const tAfterJson = typeof performance !== "undefined" ? performance.now() : 0;
  const agents = Array.isArray(j.agents) ? j.agents : [];
  if (debugRegistryTiming) {
    const st = r.headers.get("server-timing");
    console.debug(
      `[telos] GET /v1/agents → until headers ${(tAfterHeaders - t0).toFixed(0)}ms, JSON parse+read ${(tAfterJson - tAfterHeaders).toFixed(0)}ms, total ${(tAfterJson - t0).toFixed(0)}ms, ${agents.length} agents${st ? ` | ${st}` : ""}`,
    );
  }
  return agents;
}

export type PromptSuccess = {
  interpreted?: { capability: string; path: string; source?: string };
  settlement?: { transaction?: string; transactionUrl?: string };
  response?: unknown;
  httpStatus?: number;
  targetUrl?: string;
  agent?: { id: string; baseUrl: string; payTo: string } | null;
  ok?: boolean;
};

export async function postManagerPrompt(prompt: string): Promise<PromptSuccess> {
  const base = getManagerBaseUrl();
  const r = await fetch(`${base}/v1/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ prompt }),
  });
  let j: unknown = {};
  try {
    j = await r.json();
  } catch {
    /* empty */
  }
  if (!r.ok) {
    const err =
      typeof j === "object" && j !== null && "error" in j
        ? String((j as { error: string }).error)
        : `prompt_failed:${r.status}`;
    throw new Error(err);
  }
  return j as PromptSuccess;
}

export type PromptPlanResponse = {
  interpreted: { capability: string; path: string; source?: string };
  targetUrl: string;
  method: "GET" | "POST";
  /** Present for POST hires (e.g. math → { expr: "6+6+7" }). */
  body?: unknown;
  agent: { id: string; baseUrl: string; payTo: string };
};

export async function postManagerPromptPlan(prompt: string): Promise<PromptPlanResponse> {
  const base = getManagerBaseUrl();
  const r = await fetch(`${base}/v1/prompt/plan`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ prompt }),
  });
  let j: unknown = {};
  try {
    j = await r.json();
  } catch {
    /* empty */
  }
  if (!r.ok) {
    const err =
      typeof j === "object" && j !== null && "error" in j
        ? String((j as { error: string }).error)
        : `plan_failed:${r.status}`;
    throw new Error(err);
  }
  return j as PromptPlanResponse;
}

/** Plan via manager, then pay the specialist from the browser (x402 + user signer). */
export async function runManagerPromptWithClientSigner(
  prompt: string,
  signer: ClientStellarSigner,
): Promise<PromptSuccess> {
  const { paidFetchWithSigner } = await import("~/lib/browserPaidFetch");
  const plan = await postManagerPromptPlan(prompt);
  const headers: Record<string, string> = { accept: "application/json, */*" };
  let body: string | undefined;
  if (plan.method === "POST" && plan.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(plan.body);
  }
  const result = await paidFetchWithSigner(
    plan.targetUrl,
    { method: plan.method, headers, ...(body !== undefined ? { body } : {}) },
    signer,
  );

  let response: unknown;
  const ct = result.contentType ?? "";
  if (ct.includes("application/json")) {
    try {
      response = JSON.parse(result.bodyText) as unknown;
    } catch {
      response = undefined;
    }
  }

  return {
    interpreted: plan.interpreted,
    targetUrl: plan.targetUrl,
    agent: plan.agent,
    ok: result.status >= 200 && result.status < 300,
    httpStatus: result.status,
    settlement: {
      transaction: result.transaction,
      transactionUrl: result.transactionUrl,
    },
    response: response ?? result.bodyText,
  };
}
