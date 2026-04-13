import cors from "cors";
import express from "express";
import helmet from "helmet";
import { PAYWALL_DISABLED, requireNetworkConfig } from "./config.js";
import { agentRouter } from "./routes.js";
import { createApiPaymentMiddleware } from "./x402.js";

export function createApp(): express.Express {
  const app = express();

  // 1. CORS MUST BE FIRST to handle OPTIONS pre-flight requests
  app.use(
    cors({
      origin: true, // Allows your frontend domain to connect
      methods: ["GET", "POST", "OPTIONS"],
      exposedHeaders: [
        "PAYMENT-REQUIRED", 
        "PAYMENT-RESPONSE", 
        "X-402-Payment-Required"
      ],
      allowedHeaders: [
        "Content-Type", 
        "Accept", 
        "Authorization", 
        "PAYMENT-SIGNATURE",
        "X-402-Payment-Token"
      ],
      credentials: true,
    }),
  );

  // 2. HELMET SECOND with slightly relaxed policies for API cross-origin use
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // Prevents strict browser blocking of agent responses
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "telos-agents", paywall: !PAYWALL_DISABLED });
  });

  if (!PAYWALL_DISABLED) {
    const net = requireNetworkConfig();
    // Ensure the middleware doesn't block OPTIONS requests
    app.use(createApiPaymentMiddleware(net));
  }

  app.use(agentRouter());

  return app;
}