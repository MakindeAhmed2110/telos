import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { OPENROUTER_API_KEY, REGISTRY_URL } from "./config.js";
import { planPromptWithOpenRouter } from "./openRouterPlanner.js";
import { paidFetch } from "./paidFetch.js";
import { getAgent, listAgents, searchByCapability } from "./registryClient.js";

const executeBody = z
  .object({
    mode: z.enum(["by_agent_id", "by_capability", "by_url"]),
    agentId: z.string().min(1).optional(),
    capability: z.string().min(1).optional(),
    url: z.string().url().optional(),
    /** Appended to agent baseUrl (e.g. /weather/testnet?city=SF) */
    path: z.string().min(1).optional(),
    method: z.enum(["GET", "POST"]).default("GET"),
    body: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "by_url" && !data.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_url requires url" });
    }
    if (data.mode === "by_agent_id" && !data.agentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_agent_id requires agentId" });
    }
    if (data.mode === "by_capability" && !data.capability) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "by_capability requires capability" });
    }
    if (data.mode !== "by_url" && !data.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "path is required when resolving via registry (e.g. /weather/testnet?city=SF)",
      });
    }
  });

type ExecuteInput = z.infer<typeof executeBody>;

const promptBody = z.object({
  prompt: z.string().min(1).max(8000),
});

type PromptInterpreted = {
  capability: string;
  path: string;
  source?: "openrouter" | "keywords";
};

type PromptHire = PromptInterpreted & {
  method: "GET" | "POST";
  body?: unknown;
};

/** telos-agents math is POST /math/testnet with { expr }; planners often invent wrong GET paths. */
function extractMathExpr(userPrompt: string, plannerPath: string): string {
  const q = plannerPath.indexOf("?");
  if (q >= 0) {
    // Do not use URLSearchParams for equation: it treats "+" as space (x-www-form-urlencoded),
    // turning 6+6+7 into "6 6 7" and breaking mathjs with SyntaxError at char 3.
    const qs = plannerPath.slice(q + 1);
    const m = qs.match(/(?:^|&)equation=([^&]*)/i);
    if (m?.[1]) {
      try {
        const decoded = decodeURIComponent(m[1]).trim();
        if (decoded) {
          return decoded
            .replace(/(\d)\s+(?=\d)/g, "$1+")
            .replace(/\s+/g, "");
        }
      } catch {
        /* fall through */
      }
    }
  }
  const afterVerb = userPrompt.match(
    /(?:solve|calculate|evaluate|compute|maths?)\s*[:\s]+(.+)/i,
  );
  if (afterVerb?.[1]) {
    const tailTokens = afterVerb[1].match(/[\d+\-*/().]+/g);
    if (tailTokens?.length) return tailTokens.join("");
  }
  const tokens = userPrompt.match(/[\d+\-*/().]+/g);
  if (tokens?.length) return tokens.join("");
  return userPrompt.replace(/[^\d+\-*/().]/g, "").trim() || "0";
}

const TICKER_RE =
  /\b(BTC|ETH|XLM|SOL|DOGE|ADA|DOT|AVAX|LINK|UNI|SHIB|XRP|MATIC|POL|LTC|ATOM)\b/i;

function extractMarketSymbol(userPrompt: string, plannerPath: string): string {
  const q = plannerPath.indexOf("?");
  if (q >= 0) {
    const m = plannerPath.slice(q + 1).match(/(?:^|&)symbol=([^&]*)/i);
    if (m?.[1]) {
      try {
        const s = decodeURIComponent(m[1]).trim().toUpperCase();
        if (s) return s;
      } catch {
        /* fall through */
      }
    }
  }
  const tickers = userPrompt.match(TICKER_RE);
  if (tickers) return tickers[1]!.toUpperCase();
  return "XLM";
}

function parseResearchDepth(
  plannerPath: string,
): "fast" | "standard" | "deep" | undefined {
  const m = plannerPath.match(/(?:^|[?&])depth=(fast|standard|deep)(?:&|$)/i);
  return m ? (m[1]!.toLowerCase() as "fast" | "standard" | "deep") : undefined;
}

/**
 * telos-agents x402 routes are method-specific. Only weather + market are GET; all other
 * demo agents are POST + JSON. Defaulting to GET breaks deep_research / summarize / etc.
 */
function resolvePromptHire(userPrompt: string, interpreted: PromptInterpreted): PromptHire {
  const { capability, path, source } = interpreted;
  if (capability === "math") {
    return {
      capability,
      path: "/math/testnet",
      method: "POST",
      body: { expr: extractMathExpr(userPrompt, path) },
      source,
    };
  }
  if (capability === "deep_research") {
    const depth = parseResearchDepth(path);
    const body: Record<string, unknown> = { prompt: userPrompt.trim() };
    if (depth) body.depth = depth;
    return {
      capability,
      path: "/deep-research/testnet",
      method: "POST",
      body,
      source,
    };
  }
  if (capability === "summarization") {
    return {
      capability,
      path: "/summarize/testnet",
      method: "POST",
      body: { text: userPrompt.trim() },
      source,
    };
  }
  if (capability === "crypto_sentiment") {
    return {
      capability,
      path: "/crypto-sentiment/testnet",
      method: "POST",
      body: { text: userPrompt.trim() },
      source,
    };
  }
  if (capability === "website_builder") {
    return {
      capability,
      path: "/website-builder/testnet",
      method: "POST",
      body: { prompt: userPrompt.trim() },
      source,
    };
  }
  if (capability === "market") {
    const symbol = extractMarketSymbol(userPrompt, path);
    return {
      capability,
      path: `/market/testnet?symbol=${encodeURIComponent(symbol)}`,
      method: "GET",
      source,
    };
  }
  return { capability, path, method: "GET", source };
}

async function interpretUserPrompt(promptText: string): Promise<
  | { ok: true; interpreted: PromptInterpreted }
  | { ok: false; error: "prompt_not_understood"; hint: string }
> {
  const text = promptText.toLowerCase();

  let capability: string | undefined;
  let path: string | undefined;
  let interpretedSource: "openrouter" | "keywords" | undefined;

  if (OPENROUTER_API_KEY) {
    try {
      const agents = await listAgents();
      const caps = [...new Set(agents.flatMap((a) => a.capabilities))];
      const planned = await planPromptWithOpenRouter(promptText, caps);
      capability = planned.capability;
      path = planned.path;
      interpretedSource = "openrouter";
    } catch (e) {
      console.warn("[telos-manager] OpenRouter planner failed, using keyword fallback:", e);
    }
  }

  if (!capability || !path) {
    if (text.includes("weather") || text.includes("forecast")) {
      capability = "weather";
      const m = promptText.match(/\bin\s+([A-Za-z][A-Za-z\s]+)$/i);
      const city = m?.[1]?.trim().replace(/\s+/g, "+") ?? "San+Francisco";
      path = `/weather/testnet?city=${city}`;
      interpretedSource = "keywords";
    } else if (
      /\d\s*[\+\-*/]\s*\d/.test(promptText) ||
      /\b(solve|calculate|sum|add|multiply|maths?)\b/i.test(promptText)
    ) {
      capability = "math";
      path = "/math/testnet";
      interpretedSource = "keywords";
    }
  }

  if (!capability || !path) {
    return {
      ok: false,
      error: "prompt_not_understood",
      hint: OPENROUTER_API_KEY
        ? "Could not plan this prompt (OpenRouter failed and keyword fallback did not match). Use POST /v1/execute with mode by_capability or by_agent_id."
        : "Without OPENROUTER_API_KEY, only weather/forecast prompts are understood. Set the key for LLM routing, or use POST /v1/execute.",
    };
  }

  return {
    ok: true,
    interpreted: { capability, path, source: interpretedSource },
  };
}

function joinUrl(base: string, p: string): string {
  const baseTrim = base.replace(/\/+$/, "");
  const pathTrim = p.startsWith("/") ? p : `/${p}`;
  return `${baseTrim}${pathTrim}`;
}

type ExecuteFailure =
  | { error: "agent_not_found"; agentId: string; status: 404 }
  | { error: "no_agent_for_capability"; capability: string; status: 404 };

type ExecuteSuccess = {
  ok: boolean;
  targetUrl: string;
  agent: { id: string; baseUrl: string; payTo: string } | null;
  httpStatus: number;
  settlement: { transaction?: string; transactionUrl?: string };
  response: unknown;
};

async function runExecute(data: ExecuteInput): Promise<ExecuteSuccess | ExecuteFailure> {
  const { mode, agentId, capability, url, path, method, body } = data;

  let targetUrl: string;
  let chosenAgent: { id: string; baseUrl: string; payTo: string } | null = null;

  if (mode === "by_url") {
    targetUrl = url!;
  } else if (mode === "by_agent_id") {
    const agent = await getAgent(agentId!);
    if (!agent) {
      return { error: "agent_not_found", agentId: agentId!, status: 404 };
    }
    chosenAgent = { id: agent.id, baseUrl: agent.baseUrl, payTo: agent.payTo };
    targetUrl = joinUrl(agent.baseUrl, path!);
  } else {
    const matches = await searchByCapability(capability!);
    if (matches.length === 0) {
      return { error: "no_agent_for_capability", capability: capability!, status: 404 };
    }
    const agent = matches[0]!;
    chosenAgent = { id: agent.id, baseUrl: agent.baseUrl, payTo: agent.payTo };
    targetUrl = joinUrl(agent.baseUrl, path!);
  }

  const init: RequestInit = { method };
  if (method === "POST" && body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const result = await paidFetch(targetUrl, init);

  let jsonBody: unknown = undefined;
  const ct = result.contentType ?? "";
  if (ct.includes("application/json")) {
    try {
      jsonBody = JSON.parse(result.bodyText) as unknown;
    } catch {
      jsonBody = undefined;
    }
  }

  return {
    ok: result.status >= 200 && result.status < 300,
    targetUrl,
    agent: chosenAgent,
    httpStatus: result.status,
    settlement: {
      transaction: result.transaction,
      transactionUrl: result.transactionUrl,
    },
    response: jsonBody ?? result.bodyText,
  };
}

export function apiRouter(): Router {
  const r = createRouter();

  r.get("/registry/agents", async (_req: Request, res: Response) => {
    try {
      const agents = await listAgents();
      res.json({ agents, source: REGISTRY_URL });
    } catch (e) {
      res.status(502).json({ error: "registry_unreachable", message: String(e) });
    }
  });

  r.post("/execute", async (req: Request, res: Response) => {
    const parsed = executeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    try {
      const out = await runExecute(parsed.data);
      if ("error" in out) {
        res.status(out.status).json(out);
        return;
      }
      res.json(out);
    } catch (e) {
      res.status(502).json({ error: "execute_failed", message: String(e) });
    }
  });

  /**
   * Plan only: resolve prompt → registry row + target URL. No x402 / paid fetch.
   * Browser pays with Stellar Wallets Kit or a local key via @x402 client.
   */
  r.post("/prompt/plan", async (req: Request, res: Response) => {
    const parsed = promptBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const planned = await interpretUserPrompt(parsed.data.prompt);
    if (!planned.ok) {
      res.status(400).json({ error: planned.error, hint: planned.hint });
      return;
    }
    const hire = resolvePromptHire(parsed.data.prompt, planned.interpreted);
    const { capability, path, method, body, source } = hire;
    try {
      const matches = await searchByCapability(capability);
      if (matches.length === 0) {
        res.status(404).json({ error: "no_agent_for_capability", capability });
        return;
      }
      const agent = matches[0]!;
      const targetUrl = joinUrl(agent.baseUrl, path);
      res.json({
        interpreted: { capability, path, source },
        targetUrl,
        method,
        ...(body !== undefined ? { body } : {}),
        agent: { id: agent.id, baseUrl: agent.baseUrl, payTo: agent.payTo },
      });
    } catch (e) {
      res.status(502).json({ error: "plan_failed", message: String(e) });
    }
  });

  /** MVP planner + server-side x402 (manager STELLAR_PRIVATE_KEY). */
  r.post("/prompt", async (req: Request, res: Response) => {
    const parsed = promptBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const planned = await interpretUserPrompt(parsed.data.prompt);
    if (!planned.ok) {
      res.status(400).json({ error: planned.error, hint: planned.hint });
      return;
    }
    const hire = resolvePromptHire(parsed.data.prompt, planned.interpreted);
    const { capability, path, method, body, source } = hire;

    try {
      const out = await runExecute({
        mode: "by_capability",
        capability,
        path,
        method,
        body,
      });
      if ("error" in out) {
        res.status(out.status).json(out);
        return;
      }
      res.json({
        interpreted: { capability, path, source },
        ...out,
      });
    } catch (e) {
      res.status(502).json({ error: "execute_failed", message: String(e) });
    }
  });

  return r;
}
