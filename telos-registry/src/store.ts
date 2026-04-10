import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { spawn, spawnSync, type SpawnSyncReturns } from "child_process";
import type { AgentRecord, AgentRegisterInput } from "./types.js";
import { getStellarPublicKey } from "./stellarBootstrap.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "agents.json");

type Persisted = { agents: Record<string, AgentRecord> };

const ONCHAIN_CONTRACT_ID = process.env.TELOS_REGISTRY_CONTRACT_ID?.trim();
const ONCHAIN_SOURCE_ACCOUNT = process.env.TELOS_REGISTRY_SOURCE_ACCOUNT?.trim();
const ONCHAIN_NETWORK = process.env.TELOS_REGISTRY_NETWORK?.trim() || "testnet";
const STELLAR_BINS = process.platform === "win32" ? ["stellar", "stellar.cmd"] : ["stellar"];

/** In-process cache for GET /v1/agents (on-chain + file). 0 = disabled. */
const LIST_CACHE_MS = Math.max(
  0,
  Number.parseInt(process.env.TELOS_REGISTRY_LIST_CACHE_MS ?? "5000", 10) || 5000,
);

/** Max concurrent Stellar CLI reads when listing agents on-chain. */
const LIST_ONCHAIN_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.TELOS_REGISTRY_LIST_CONCURRENCY ?? "8", 10) || 8,
);

const onchainConfigured = Boolean(ONCHAIN_CONTRACT_ID && ONCHAIN_SOURCE_ACCOUNT);

/** Set when on-chain mode passes CLI detection; reused for spawn/spawnSync. */
let resolvedStellarBin: string | null = null;

let listAgentsCache: { at: number; data: AgentRecord[] } | null = null;

function invalidateAgentsListCache(): void {
  listAgentsCache = null;
}

function stellarCliAppearsMissing(stderr?: string, stdout?: string, errorMessage?: string): boolean {
  const msg = `${stderr ?? ""} ${stdout ?? ""} ${errorMessage ?? ""}`.toLowerCase();
  return (
    msg.includes("not recognized") ||
    msg.includes("enoent") ||
    msg.includes("no such file or directory") ||
    msg.includes("is not recognized as an internal or external command")
  );
}

function detectOnchainEnabled(): boolean {
  if (!onchainConfigured) return false;
  for (const bin of STELLAR_BINS) {
    const result = spawnSync(bin, ["--version"], {
      shell: false,
      encoding: "utf8",
      stdio: "pipe",
    });
    if (!stellarCliAppearsMissing(result.stderr, result.stdout, result.error?.message)) {
      resolvedStellarBin = bin;
      return true;
    }
  }
  console.warn(
    "[telos-registry] On-chain config detected, but Stellar CLI is unavailable; falling back to file storage.",
  );
  return false;
}

const isOnchainEnabled = detectOnchainEnabled();

function runStellar(args: string[]) {
  if (resolvedStellarBin) {
    return spawnSync(resolvedStellarBin, args, {
      shell: false,
      encoding: "utf8",
      stdio: "pipe",
    });
  }
  let lastResult: SpawnSyncReturns<string> | undefined;
  for (const bin of STELLAR_BINS) {
    const result = spawnSync(bin, args, {
      shell: false,
      encoding: "utf8",
      stdio: "pipe",
    });
    lastResult = result;
    if (!stellarCliAppearsMissing(result.stderr, result.stdout, result.error?.message)) {
      return result;
    }
  }
  return lastResult ?? spawnSync("stellar", args, { shell: false, encoding: "utf8", stdio: "pipe" });
}

interface ChainProfile {
  owner: string;
  pay_to: string;
  endpoint: string;
  metadata_uri: string;
  updated_at_ledger: number;
}

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

function buildStellarInvokeArgs(contractArgs: string[], send: boolean): string[] {
  if (!ONCHAIN_CONTRACT_ID || !ONCHAIN_SOURCE_ACCOUNT) {
    throw new Error("On-chain mode requires TELOS_REGISTRY_CONTRACT_ID and TELOS_REGISTRY_SOURCE_ACCOUNT");
  }
  const baseArgs = [
    "contract",
    "invoke",
    "--id",
    ONCHAIN_CONTRACT_ID,
    "--network",
    ONCHAIN_NETWORK,
    "--source-account",
    ONCHAIN_SOURCE_ACCOUNT,
  ];
  if (send) {
    baseArgs.push("--send", "yes");
  }
  baseArgs.push("--", ...contractArgs);
  return baseArgs;
}

function runStellarInvoke(args: string[], send: boolean): string {
  const baseArgs = buildStellarInvokeArgs(args, send);
  const result = runStellar(baseArgs);

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(stderr || stdout || "stellar invoke failed");
  }
  return (result.stdout || "").trim();
}

/** Read-only contract invoke via child process (parallel-safe vs sync stellar). */
function runStellarInvokeAsync(args: string[], send: boolean): Promise<string> {
  const bin = resolvedStellarBin;
  if (!bin) {
    return Promise.reject(new Error("Stellar CLI not resolved"));
  }
  const baseArgs = buildStellarInvokeArgs(args, send);
  return new Promise((resolve, reject) => {
    const child = spawn(bin, baseArgs, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const out = child.stdout;
    const err = child.stderr;
    if (!out || !err) {
      reject(new Error("stellar spawn: missing stdio pipes"));
      return;
    }
    out.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    err.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (invokeErr: Error) => reject(invokeErr));
    child.on("close", (code: number | null) => {
      if (code !== 0) {
        const e = (stderr || "").trim() || (stdout || "").trim() || "stellar invoke failed";
        reject(new Error(e));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function parallelLimit<T>(factories: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = new Array(factories.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= factories.length) return;
      results[i] = await factories[i]();
    }
  }
  const n = Math.min(limit, Math.max(1, factories.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

function encodeMetadata(record: AgentRecord): string {
  const payload = {
    id: record.id,
    name: record.name,
    description: record.description,
    capabilities: record.capabilities,
    suggestedPrice: record.suggestedPrice,
    network: record.network,
    metadata: record.metadata,
    registeredAt: record.registeredAt,
    updatedAt: record.updatedAt,
  };
  return `data:application/json,${encodeURIComponent(JSON.stringify(payload))}`;
}

function decodeMetadata(uri: string): Partial<AgentRecord> {
  const prefix = "data:application/json,";
  if (!uri.startsWith(prefix)) return {};
  try {
    const raw = decodeURIComponent(uri.slice(prefix.length));
    return JSON.parse(raw) as Partial<AgentRecord>;
  } catch {
    return {};
  }
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Failed to parse JSON from stellar output: ${raw}`);
  }
}

function profileRecordFromGetOutput(
  profileRaw: string,
  hexId: string,
  /** When set (e.g. GET /v1/agents/:id), use this as canonical id instead of metadata. */
  logicalId?: string,
): AgentRecord | null {
  if (profileRaw === "null") return null;
  const profile = parseJson<ChainProfile>(profileRaw);
  const fromMeta = decodeMetadata(profile.metadata_uri);
  const id =
    logicalId !== undefined && logicalId.trim() !== ""
      ? logicalId.trim()
      : (fromMeta.id || "").trim() || hexId;
  const now = new Date().toISOString();
  return {
    id,
    name: fromMeta.name || id,
    description: fromMeta.description,
    capabilities: Array.isArray(fromMeta.capabilities) && fromMeta.capabilities.length > 0
      ? fromMeta.capabilities
      : ["unknown"],
    baseUrl: profile.endpoint,
    payTo: profile.pay_to,
    suggestedPrice: fromMeta.suggestedPrice,
    network:
      fromMeta.network === "stellar:mainnet" || fromMeta.network === "stellar:testnet"
        ? fromMeta.network
        : "stellar:testnet",
    metadata: fromMeta.metadata,
    registeredAt: fromMeta.registeredAt || now,
    updatedAt: fromMeta.updatedAt || now,
  };
}

async function listAgentsOnchain(): Promise<AgentRecord[]> {
  const idsRaw = runStellarInvoke(["list_ids"], false);
  const chainIds = parseJson<string[]>(idsRaw);
  if (chainIds.length === 0) return [];

  const factories = chainIds.map(
    (hexId) => () =>
      runStellarInvokeAsync(["get", "--agent_id", hexId], false).then((raw) =>
        profileRecordFromGetOutput(raw, hexId),
      ),
  );
  const rows = await parallelLimit(factories, LIST_ONCHAIN_CONCURRENCY);
  const records = rows.filter((r): r is AgentRecord => r != null);
  return records.sort((a, b) => a.id.localeCompare(b.id));
}

async function getAgentOnchain(id: string): Promise<AgentRecord | undefined> {
  const hexId = hashId(id);
  const profileRaw = runStellarInvoke(["get", "--agent_id", hexId], false);
  return profileRecordFromGetOutput(profileRaw, hexId, id) ?? undefined;
}

async function upsertAgentOnchain(input: AgentRegisterInput): Promise<AgentRecord> {
  const existing = await getAgentOnchain(input.id);
  const now = new Date().toISOString();
  const record: AgentRecord = {
    ...input,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
  };
  const metadataUri = encodeMetadata(record);
  const hexId = hashId(record.id);

  if (existing) {
    runStellarInvoke(
      [
        "update",
        "--agent_id",
        hexId,
        "--pay_to",
        record.payTo,
        "--endpoint",
        record.baseUrl,
        "--metadata_uri",
        metadataUri,
      ],
      true,
    );
  } else {
    const owner = getStellarPublicKey(ONCHAIN_SOURCE_ACCOUNT!);
    runStellarInvoke(
      [
        "register",
        "--agent_id",
        hexId,
        "--owner",
        owner,
        "--pay_to",
        record.payTo,
        "--endpoint",
        record.baseUrl,
        "--metadata_uri",
        metadataUri,
      ],
      true,
    );
  }
  return record;
}

async function deleteAgentOnchain(id: string): Promise<boolean> {
  const existing = await getAgentOnchain(id);
  if (!existing) return false;
  runStellarInvoke(["remove", "--agent_id", hashId(id)], true);
  return true;
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: Persisted = { agents: {} };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readAll(): Promise<Persisted> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Persisted;
  if (!parsed.agents || typeof parsed.agents !== "object") {
    return { agents: {} };
  }
  return parsed;
}

async function writeAll(data: Persisted): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function listAgents(): Promise<AgentRecord[]> {
  const now = Date.now();
  if (LIST_CACHE_MS > 0 && listAgentsCache && now - listAgentsCache.at < LIST_CACHE_MS) {
    return listAgentsCache.data;
  }

  let data: AgentRecord[];
  if (isOnchainEnabled) {
    data = await listAgentsOnchain();
  } else {
    const { agents } = await readAll();
    data = Object.values(agents).sort((a, b) => a.id.localeCompare(b.id));
  }

  if (LIST_CACHE_MS > 0) {
    listAgentsCache = { at: now, data };
  }
  return data;
}

export async function getAgent(id: string): Promise<AgentRecord | undefined> {
  if (isOnchainEnabled) {
    return getAgentOnchain(id);
  }
  const { agents } = await readAll();
  return agents[id];
}

export async function upsertAgent(record: AgentRegisterInput): Promise<AgentRecord> {
  if (isOnchainEnabled) {
    const saved = await upsertAgentOnchain(record);
    invalidateAgentsListCache();
    return saved;
  }
  const data = await readAll();
  const now = new Date().toISOString();
  const existing = data.agents[record.id];
  const next: AgentRecord = {
    ...record,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
  };
  data.agents[record.id] = next;
  await writeAll(data);
  invalidateAgentsListCache();
  return next;
}

export async function deleteAgent(id: string): Promise<boolean> {
  if (isOnchainEnabled) {
    const ok = await deleteAgentOnchain(id);
    if (ok) invalidateAgentsListCache();
    return ok;
  }
  const data = await readAll();
  if (!data.agents[id]) return false;
  delete data.agents[id];
  await writeAll(data);
  invalidateAgentsListCache();
  return true;
}

export function getStorageMode(): "onchain" | "file" {
  return isOnchainEnabled ? "onchain" : "file";
}

/** Absolute path to file-backed agent JSON (null if on-chain mode). Not in git — see `.gitignore`. */
export function getAgentsPersistencePath(): string | null {
  return isOnchainEnabled ? null : path.resolve(DATA_FILE);
}
