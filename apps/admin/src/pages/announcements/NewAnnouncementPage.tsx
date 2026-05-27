import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

export function NewAnnouncementPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          linkUrl: linkUrl.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        setError(err?.error ?? err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const data = (await res.json()) as { announcement: { id: string } };
      navigate(`/admin/announcements/${data.announcement.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-animate-reveal max-w-2xl">
      <p className="admin-classification mb-6">US-RSE · Admin · Announcements · New</p>
      <h2 className="admin-display mb-8" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        New announcement
      </h2>
      {error && (
        <p className="mb-6 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <EditorialInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <EditorialTextarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
        />
        <EditorialInput
          label="Link URL (optional)"
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          hint="Optional link the banner CTA points to"
        />
        <EditorialInput
          label="Expires at (optional)"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          hint="After this time, the announcement auto-transitions to expired"
        />
        <button
          type="submit"
          disabled={saving || !title || !body}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
      </form>
    </div>
  );
}
