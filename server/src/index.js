import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import assistantRoutes from "./routes/assistantRoutes.js";
import generateRoutes from "./routes/generateRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = process.env.PORT || 4000;

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://siteforgeapp.vercel.app"
];

const configuredAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .join(",");

const allowedOrigins = new Set(
  [defaultAllowedOrigins.join(","), configuredAllowedOrigins]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean)
);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/+$/, "");
  if (allowedOrigins.has(normalizedOrigin)) return true;

  // Allow Vercel preview deployments for this app (e.g. siteforgeapp-git-branch.vercel.app)
  // so preview URLs can talk to the same backend without manual env updates.
  if (/^https:\/\/siteforgeapp(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(normalizedOrigin)) return true;

  return false;
}

app.use(helmet());

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "12mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ai-website-builder-api" });
});

app.use("/api/projects", projectRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/assistant", assistantRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
