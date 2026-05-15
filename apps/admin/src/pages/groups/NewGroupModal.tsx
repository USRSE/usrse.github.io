import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewGroupModal({ onClose, onCreated }: Props) {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<"working_group" | "affinity_group" | "regional_group">("working_group");
  const [description, setDescription] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          slackChannel: slackChannel.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { ok: true; group: { id: string } };
      onCreated();
      navigate(`/groups/${body.group.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white p-8 max-w-lg w-full rounded-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="admin-classification mb-4">New group</p>
        <h3 className="admin-display mb-6" style={{ fontSize: "1.5rem" }}>
          Create a group.
        </h3>

        {error && (
          <p className="mb-4 admin-classification" style={{ color: "var(--color-danger-700)" }}>
            {error}
          </p>
        )}

        <div className="space-y-6">
          <EditorialInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div>
            <p className="admin-classification mb-2">Type</p>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="bg-transparent border-0 outline-none py-1.5 w-full"
              style={{ borderBottom: "1px solid var(--admin-rule)", color: "var(--admin-ink)", fontSize: "15px" }}
            >
              <option value="working_group">Working group</option>
              <option value="affinity_group">Affinity group</option>
              <option value="regional_group">Regional group</option>
            </select>
          </div>
          <EditorialTextarea
            label="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            hint="One sentence shown on the public group list card."
          />
          <EditorialInput
            label="Slack channel (optional)"
            value={slackChannel}
            onChange={(e) => setSlackChannel(e.target.value)}
            hint="e.g., wg-outreach — no leading #."
          />
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="admin-classification disabled:opacity-50"
            style={{ color: "var(--admin-ink-medium)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create draft →"}
          </button>
        </div>
      </div>
    </div>
  );
}
