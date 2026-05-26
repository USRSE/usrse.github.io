import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import { EditorialInput } from "../../components/EditorialInput";
import { EditorialTextarea } from "../../components/EditorialTextarea";

const EVENT_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "meetup", label: "Meetup" },
  { value: "webinar", label: "Webinar" },
  { value: "community_call", label: "Community call" },
  { value: "other", label: "Other" },
];

export function NewEventPage() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("workshop");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          startDate,
          endDate: endDate || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
        setError(err?.error ?? err?.message ?? `POST responded ${res.status}`);
        return;
      }
      const body = (await res.json()) as { event: { id: string } };
      navigate(`/admin/events/${body.event.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-animate-reveal max-w-2xl">
      <p className="admin-classification mb-6">US-RSE · Admin · Events · New</p>
      <h2 className="admin-display mb-8" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}>
        New event
      </h2>
      {error && (
        <p className="mb-6 admin-classification" style={{ color: "var(--color-danger-700)" }}>
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <EditorialInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <label className="admin-classification block mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 rounded-md border admin-input w-full"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <EditorialInput
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <EditorialInput
          label="End date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <EditorialInput
          label="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <EditorialInput
          label="External registration URL (optional)"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          hint="Use this when registration is hosted elsewhere"
        />
        <EditorialTextarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        <button
          type="submit"
          disabled={saving || !name || !startDate}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
      </form>
    </div>
  );
}
