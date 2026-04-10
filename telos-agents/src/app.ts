import cors from "cors";
import express from "express";
import helmet from "helmet";
import { PAYWALL_DISABLED, requireNetworkConfig } from "./config.js";
import { agentRouter } from "./routes.js";
import { createApiPaymentMiddleware } from "./x402.js";

export function createApp(): express.Express {
  const app = express();
  // Allow browser dashboards on another origin/port to read API responses (math x402 works; GET/POST to other routes must not be blocked by CORP).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  // x402 v2 uses PAYMENT-REQUIRED / PAYMENT-RESPONSE headers; browsers hide them from JS unless exposed.
  app.use(
    cors({
      origin: true,
      exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
      allowedHeaders: ["Content-Type", "Accept", "Authorization", "PAYMENT-SIGNATURE"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "telos-agents", paywall: !PAYWALL_DISABLED });
  });

  if (!PAYWALL_DISABLED) {
    const net = requireNetworkConfig();
    app.use(createApiPaymentMiddleware(net));
  }

  app.use(agentRouter());

  return app;
}
