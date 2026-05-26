import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { useShellActor } from "../../layout/AdminShell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

type Tab = "identity" | "content" | "review" | "audit";

interface EventDetail {
  ok: true;
  event: {
    id: string;
    slug: string;
    name: string;
    type: string;
    status: string;
    revision: number;
    scope: string;
    authorId: string | null;
    hostGroupId: string | null;
    hostOrgId: string | null;
    startDate: string;
    endDate: string | null;
    location: string | null;
    url: string | null;
    description: string | null;
    externalUrl: string | null;
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

export function EventDetailPage() {
  const apiFetch = useApi();
  const actor = useShellActor();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Identity drafts
  const [draftName, setDraftName] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftExternalUrl, setDraftExternalUrl] = useState("");

  // Content drafts
  const [draftDescription, setDraftDescription] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");

  // Comment composer
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await apiFetch(`/admin/events/${id}`);
      if (!res.ok) {
        setError(`/admin/events/${id} responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as EventDetail;
      setData(body);
      setDraftName(body.event.name);
      setDraftLocation(body.event.location ?? "");
      setDraftExternalUrl(body.event.externalUrl ?? "");
      setDraftDescription(body.event.description ?? "");
      setDraftStartDate(body.event.startDate);
      setDraftEndDate(body.event.endDate ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchEvent(body: Record<string, unknown>) {
    if (!data) return;
    setActing(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/admin/events/${data.event.id}`, {
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
      const res = await apiFetch(`/admin/events/${data.event.id}/transitions`, {
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
      const res = await apiFetch(`/admin/events/${data.event.id}/comments`, {
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

  const e = data.event;
  const isStaff = actor.systemTier >= 1;
  const isAuthor = actor.user.id === e.authorId;
  const canTransition = isStaff || (isAuthor && (e.status === "draft" || e.status === "changes_requested"));

  // Approval count on current revision
  const currentRevApprovals = data.reviews
    .filter((r) => r.decision === "approve" && r.entityRevision === e.revision)
    .map((r) => r.reviewerId);
  const uniqueApprovals = new Set(currentRevApprovals).size;

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">US-RSE · Admin · Events · {e.name}</p>
      <h2 className="admin-display mb-2" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        {e.name}
      </h2>
      <div className="flex items-center gap-4 mb-10">
        <span className="admin-classification">{e.type}</span>
        <span className="admin-classification">{e.scope}</span>
        <span className="admin-classification">{e.status}</span>
        <span className="admin-classification">rev {e.revision}</span>
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
            label="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <EditorialInput
            label="Location"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
          />
          <EditorialInput
            label="External registration URL"
            value={draftExternalUrl}
            onChange={(e) => setDraftExternalUrl(e.target.value)}
            hint="When set, the public event page links here instead of showing internal signup"
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchEvent({
              name: draftName.trim() || undefined,
              location: draftLocation.trim() || null,
              externalUrl: draftExternalUrl.trim() || null,
            })}
            className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Save identity
          </button>
        </section>
      )}

      {tab === "content" && (
        <section className="max-w-2xl space-y-6">
          <EditorialInput
            label="Start date"
            type="date"
            value={draftStartDate}
            onChange={(e) => setDraftStartDate(e.target.value)}
          />
          <EditorialInput
            label="End date"
            type="date"
            value={draftEndDate}
            onChange={(e) => setDraftEndDate(e.target.value)}
          />
          <EditorialTextarea
            label="Description"
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={8}
          />
          <button
            type="button"
            disabled={acting}
            onClick={() => patchEvent({
              startDate: draftStartDate,
              endDate: draftEndDate || null,
              description: draftDescription.trim() || null,
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
              Approvals on revision {e.revision}: {uniqueApprovals} of 2
            </p>
            <div className="flex gap-3 flex-wrap">
              {canTransition && e.status === "draft" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Submit for review
                </button>
              )}
              {canTransition && e.status === "changes_requested" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => transition("submit_for_review")}
                  className="px-5 py-2 rounded-md bg-purple-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Resubmit
                </button>
              )}
              {isStaff && e.status === "in_review" && !isAuthor && (
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
              {isStaff && e.status === "published" && (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      if (window.confirm("Cancel this event?")) void transition("cancel");
                    }}
                    className="px-5 py-2 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel event
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => transition("archive")}
                    className="px-5 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Archive
                  </button>
                </>
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
        <Link to="/admin/events">← Back to events</Link>
      </p>
    </div>
  );
}
