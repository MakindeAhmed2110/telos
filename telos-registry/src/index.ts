import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { agentsRouter } from "./routes/agents.js";
import { bootstrapStellarIdentityFromEnv } from "./stellarBootstrap.js";
import { getAgentsPersistencePath, getStorageMode } from "./store.js";

const PORT = Number(process.env.PORT ?? "4010");

bootstrapStellarIdentityFromEnv();
const storageMode = getStorageMode();

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "telos-registry",
    storage: storageMode,
  });
});

app.use("/v1/agents", agentsRouter());

app.listen(PORT, () => {
  console.log(`[telos-registry] listening on http://localhost:${PORT}`);
  console.log(`[telos-registry] storage=${storageMode}`);
  const filePath = getAgentsPersistencePath();
  if (filePath) {
    console.log(`[telos-registry] agent data file (local only, gitignored): ${filePath}`);
    console.log(`[telos-registry] new clone / deleted data/ → empty list until you PUT agents or run register:agents`);
  }
});
