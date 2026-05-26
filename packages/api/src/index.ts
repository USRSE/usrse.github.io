import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";
import { meRoute } from "./routes/me";
import { membersRoute } from "./routes/members";
import { vocabRoute } from "./routes/vocab";
import { webhooksRoute } from "./routes/webhooks";
import { publicGroupsRoute } from "./routes/groups";
import { organizationsRoute } from "./routes/organizations";
import { adminApi } from "./routes/admin";
import { announcementsRoute } from "./routes/announcements";
import { eventsRoute } from "./routes/events";
import { optionalActor } from "./middleware/optionalActor";
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
  // Version exposed unconditionally so the CI verify step can run
  // even when the DB is unavailable. CI compares this against the
  // just-pushed git SHA to confirm the new worker is actually live.
  const version = c.env.GIT_SHA ?? "dev";

  if (!c.env.DATABASE_URL) {
    return c.json({ ok: false, version, error: "DATABASE_URL not configured" }, 500);
  }

  const sql = neon(c.env.DATABASE_URL);
  const start = Date.now();
  const rows = await sql`select 1 as one`;
  const latencyMs = Date.now() - start;

  return c.json({
    ok: true,
    version,
    db: "neon",
    result: rows[0],
    latencyMs,
  });
});

app.route("/webhooks", webhooksRoute);
app.route("/me", meRoute);
app.route("/members", membersRoute);
app.route("/vocab", vocabRoute);
app.route("/groups", publicGroupsRoute);
app.route("/organizations", organizationsRoute);
app.route("/announcements", announcementsRoute);
app.use("/events", optionalActor);
app.use("/events/*", optionalActor);
app.route("/events", eventsRoute);
app.route("/admin", adminApi);

export default app;
