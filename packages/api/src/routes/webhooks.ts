import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { profiles, users } from "../db/schema";
import { generateMemberId } from "../lib/member-id";
import { verifyWorkosWebhookSignature } from "../lib/verify-webhook";
import type { AppEnv } from "../types";

interface WorkosUser {
  id: string;
  email: string;
  email_verified?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface WorkosEvent {
  id: string;
  event: string;
  data: WorkosUser;
  created_at: string;
}

export const webhooksRoute = new Hono<AppEnv>();

webhooksRoute.post("/workos", async (c) => {
  const sigHeader = c.req.header("WorkOS-Signature");
  if (!sigHeader) {
    return c.json({ ok: false, error: "Missing WorkOS-Signature header" }, 400);
  }

  if (!c.env.WORKOS_WEBHOOK_SECRET) {
    return c.json(
      { ok: false, error: "WORKOS_WEBHOOK_SECRET is not configured" },
      500
    );
  }

  const body = await c.req.text();

  const ok = await verifyWorkosWebhookSignature({
    signatureHeader: sigHeader,
    body,
    secret: c.env.WORKOS_WEBHOOK_SECRET,
  });
  if (!ok) {
    const sigPreview = sigHeader.replace(/v1=([0-9a-f]{8})[0-9a-f]+/, "v1=$1…");
    console.warn(
      "WorkOS webhook signature mismatch",
      JSON.stringify({
        signatureHeaderPreview: sigPreview,
        bodyLength: body.length,
        secretConfigured: c.env.WORKOS_WEBHOOK_SECRET.length > 0,
      })
    );
    return c.json({ ok: false, error: "Invalid signature" }, 401);
  }

  let event: WorkosEvent;
  try {
    event = JSON.parse(body) as WorkosEvent;
  } catch {
    return c.json({ ok: false, error: "Body is not valid JSON" }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);

  switch (event.event) {
    case "user.created":
      await handleUserCreated(db, event.data);
      break;
    case "user.updated":
      await handleUserUpdated(db, event.data);
      break;
    case "user.deleted":
      await handleUserDeleted(db, event.data);
      break;
    default:
      // Ignore non-user events (organization, role, etc.) for now.
      return c.json({ ok: true, ignored: event.event });
  }

  return c.json({ ok: true, event: event.event });
});

async function handleUserCreated(
  db: ReturnType<typeof createDb>,
  workosUser: WorkosUser
) {
  for (let attempts = 0; attempts < 5; attempts++) {
    try {
      await db
        .insert(users)
        .values({
          workosId: workosUser.id,
          memberId: generateMemberId(),
          email: workosUser.email,
        })
        .onConflictDoNothing({ target: users.workosId });
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/users_member_id_unique/.test(msg)) continue;
      throw e;
    }
  }
  throw new Error("Could not generate unique member_id after 5 attempts");
}

async function handleUserUpdated(
  db: ReturnType<typeof createDb>,
  workosUser: WorkosUser
) {
  await db
    .update(users)
    .set({
      email: workosUser.email,
      updatedAt: new Date(),
    })
    .where(eq(users.workosId, workosUser.id));

  const fullName = [workosUser.first_name, workosUser.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName || workosUser.profile_picture_url) {
    const userRow = await db.query.users.findFirst({
      where: eq(users.workosId, workosUser.id),
      columns: { id: true },
    });
    if (userRow) {
      await db
        .update(profiles)
        .set({
          ...(fullName ? { displayName: fullName } : {}),
          ...(workosUser.profile_picture_url !== undefined
            ? { photoUrl: workosUser.profile_picture_url }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userRow.id));
    }
  }
}

async function handleUserDeleted(
  db: ReturnType<typeof createDb>,
  workosUser: WorkosUser
) {
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.workosId, workosUser.id));
}
