import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";
import { meRoute } from "./routes/me";
import { webhooksRoute } from "./routes/webhooks";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
  })
);

app.get("/", (c) => c.json({ name: "@us-rse/api", ok: true }));

app.get("/health", async (c) => {
  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, error: "DATABASE_URL not configured" }, 500);
  }

  const sql = neon(c.env.DATABASE_URL);
  const start = Date.now();
  const rows = await sql`select 1 as one`;
  const latencyMs = Date.now() - start;

  return c.json({
    ok: true,
    db: "neon",
    result: rows[0],
    latencyMs,
  });
});

app.route("/webhooks", webhooksRoute);
app.route("/me", meRoute);

export default app;
