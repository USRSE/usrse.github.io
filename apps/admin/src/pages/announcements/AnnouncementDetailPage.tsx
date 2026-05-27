import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type Tab = "identity" | "content" | "review" | "audit";

interface AnnouncementDetail {
  ok: true;
  announcement: {
    id: string;
    title: string;
    body: string;
    linkUrl: string | null;
    expiresAt: string | null;
    status: string;
    revision: number;
    scope: string;
    authorId: string | null;
    hostGroupId: string | null;
    hostOrgId: string | null;
    thumbnailKey: string | null;
    createdAt: string;
    updatedAt: string;
  };
  reviews: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string | null;
    decision: "approve" | "reject" | "request_changes";
    comment: string | null;
    entityRevision: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string | null;
    body: string;
    createdAt: string;
  }>;
  audit: Array<{
    id: string;
    action: string;
    actorId: string;
    payload: unknown;
    createdAt: string;
  }>;
}

export function AnnouncementDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<AnnouncementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftLinkUrl, setDraftLinkUrl] = useState("");
  const [draftExpiresAt, setDraftExpiresAt] = useState("");

  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${id}`);
      if (!res.ok) {
        setError(`/admin/announcements/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as AnnouncementDetail;
      setData(body);
      setDraftTitle(body.announcement.title);
      setDraftBody(body.announcement.body);
      setDraftLinkUrl(body.announcement.linkUrl ?? "");
      setDraftExpiresAt(
        body.announcement.expiresAt
          ? new Date(body.announcement.expiresAt).toISOString().slice(0, 16)
          : ""
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchAnnouncement(body: Record<string, unknown>) {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `PATCH responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function transition(action: string, comment?: string) {
    if (!data) return;
    if (
      (action === "reject" || action === "request_changes") &&
      !comment?.trim()
    ) {
      setActionError("A comment is required for this action.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `POST responded ${res.status}`);
        return;
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  async function postComment() {
    if (!data || !newComment.trim()) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/announcements/${data.announcement.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(err?.error ?? `POST responded ${res.status}`);
        return;
      }
      setNewComment("");
      await load();
    } finally {
      setActing(false);
    }
  }

  if (error)
    return (
      <p className="admin-classification" style={{ color: "var(--color-danger-700)" }}>
        {error}
      </p>
    );
  if (!data) return <p className="admin-marginalia">Loading…</p>;

  const a = data.announcement;
  const isStaff = actor.systemTier >= 1;
  const isAuthor = actor.user.id === a.authorId;
  const canTransition = isStaff || (isAuthor && (a.status === "draft" || a.status === "changes_requested"));

  const currentRevApprovals = data.reviews
    .filter((r) => r.decision === "approve" && r.entityRevision === a.revision)
    .map((r) => r.reviewerId);
  const uniqueApprovals = new Set(currentRevApprovals).size;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Announcements · {a.title}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {a.title}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{a.scope}</span>
        <span className="admin-classification">{a.status}</span>
        <span className="admin-classification">rev {a.revision}</span>
      </div>

      <nav
        className="flex items-baseline gap-8 mb-8"
        style={{ borderBottom: "1px solid var(--admin-rule)" }}
      >
        {(["identity", "content", "review", "audit"] as Tab[]).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="pb-3 admin-classification transition-colors"
            style={{
              color: tab === t ? "var(--admin-ribbon)" : "var(--admin-ink-medium)",
              borderBottom: tab === t ? "2px solid var(--admin-ribbon)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            <span className="tabular-nums mr-2">{String(i + 1).padStart(2, "0")}</span>
            <span>{t[0].toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </nav>

      {actionError && (
        <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {actionError}
        </p>
      )}

      {tab === "identity" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput
            label="Title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchAnnouncement({
              title: draftTitle.trim() || undefined,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save identity
          </button>
        </section>
      )}

      {tab === "content" && (
        <section className="max-w-2xl space-y-6">
          <EditorialTextarea
            label="Body"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={8}
          />
          <EditorialInput
            label="Link URL"
            value={draftLinkUrl}
            onChange={(e) => setDraftLinkUrl(e.target.value)}
          />
          <EditorialInput
            label="Expires at"
            type="datetime-local"
            value={draftExpiresAt}
            onChange={(e) => setDraftExpiresAt(e.target.value)}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchAnnouncement({
              body: draftBody.trim() || undefined,
              linkUrl: draftLinkUrl.trim() || null,
              expiresAt: draftExpiresAt ? new Date(draftExpiresAt).toISOString() : null,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save content
          </button>
        </section>
      )}

      {tab === "review" && (
        <section className="max-w-3xl space-y-8">
          <div>
            <p className="admin-classification mb-3">
              Approvals on revision {a.revision}: {uniqueApprovals} of 2
            </p>
            <div className="flex gap-3 flex-wrap">
              {canTransition && a.status === "draft" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Submit for review
                </button>
              )}
              {canTransition && a.status === "changes_requested" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Resubmit
                </button>
              )}
              {isStaff && a.status === "in_review" && !isAuthor && (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => transition("approve")}
                    className="px-5 py-2 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const c = window.prompt("Comment (required):");
                      if (c) void transition("request_changes", c);
                    }}
                    className="px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const c = window.prompt("Reason (required):");
                      if (c) void transition("reject", c);
                    }}
                    className="px-5 py-2 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {isStaff && a.status === "published" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("archive")}
                  className="px-5 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Archive
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="admin-classification mb-3">Review history</p>
            {data.reviews.length === 0 && <p className="admin-marginalia">No reviews yet.</p>}
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-mono">[{r.decision}]</span>{" "}
                  <span>{r.reviewerName ?? r.reviewerId}</span>{" "}
                  <span className="admin-marginalia">on rev {r.entityRevision}</span>
                  {r.comment && <p className="ml-6 mt-1 text-gray-700">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="admin-classification mb-3">Comments</p>
            <ul className="space-y-3 mb-4">
              {data.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-semibold">{c.authorName ?? c.authorId}</span>{" "}
                  <span className="admin-marginalia">{new Date(c.createdAt).toLocaleString()}</span>
                  <p className="mt-1 text-gray-800">{c.body}</p>
                </li>
              ))}
            </ul>
            <EditorialTextarea
              label="Add comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button
              type="button"
              disabled={acting || !newComment.trim()}
              onClick={postComment}
              className="mt-2 px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              Post comment
            </button>
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="max-w-3xl">
          {data.audit.length === 0 && <p className="admin-marginalia">No audit entries yet.</p>}
          <ul className="space-y-2">
            {data.audit.map((a) => (
              <li key={a.id} className="text-sm font-mono">
                <span className="admin-marginalia">{new Date(a.createdAt).toLocaleString()}</span>{" "}
                <span className="font-semibold">{a.action}</span>
                <span className="admin-marginalia"> by {a.actorId}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 admin-marginalia">
        <Link to="/admin/announcements">← Back to announcements</Link>
      </p>
    </div>
  );
}
