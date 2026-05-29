import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function NewFormPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slugInvalid = slug.length > 0 && !SLUG_PATTERN.test(slug);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugInvalid) {
      setError("Slug must be lowercase letters, numbers, and hyphens only.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const trimmedDescription = description.trim();
      const res = await apiFetch("/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: trimmedDescription || undefined,
          schema: {
            fields: [
              { id: "name", type: "text", label: "Name", required: true },
            ],
          },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        setError(err?.error ?? err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const data = (await res.json()) as { form: { id: string } };
      navigate(`/admin/forms/${data.form.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-animate-reveal max-w-2xl">
      <p className="admin-classification mb-6">US-RSE · Admin · Forms · New</p>
      <h2 className="admin-display mb-8" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        New form
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
        <EditorialInput
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          hint="lowercase letters, numbers, and hyphens only"
          error={slugInvalid ? "lowercase letters, numbers, and hyphens only" : null}
        />
        <EditorialTextarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <button
          type="submit"
          disabled={saving || !title || !slug || slugInvalid}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
      </form>
    </div>
  );
}
