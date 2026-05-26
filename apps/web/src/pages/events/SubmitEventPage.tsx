import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { EventsLayout } from "@/components/events/EventsLayout";
import { useApi } from "@/lib/api";

/**
 * Public, auth-gated member submission for the Events lifecycle.
 *
 * Anonymous visitors see a sign-in pitch (matching the AccountPage
 * SignedOutState pattern); signed-in members see the submission form.
 *
 * On success the page navigates to /events?submitted=1 so the index
 * page can show a confirmation banner. We don't try to deep-link to
 * the new event — at submit time it's only in_review, not yet public.
 */

type EventType =
  | "conference"
  | "workshop"
  | "meetup"
  | "webinar"
  | "community_call"
  | "other";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "meetup", label: "Meetup" },
  { value: "webinar", label: "Webinar" },
  { value: "community_call", label: "Community call" },
  { value: "other", label: "Other" },
];

export function SubmitEventPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) return <LoadingState />;
  if (!user) return <SignedOutState />;

  return (
    <EventsLayout
      title="Submit an Event"
      subtitle="Add your event to the community calendar — staff will review before it goes live."
      prevPage={{ path: "/events", label: "Upcoming Events" }}
      nextPage={{
        path: "/events/calendar",
        label: "Calendar",
        teaser: "See the full schedule",
      }}
    >
      <SubmitForm />
    </EventsLayout>
  );
}

// ─── The form ─────────────────────────────────────────────────────────

interface FormState {
  name: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location: string;
  externalUrl: string;
  description: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  type: "workshop",
  startDate: "",
  endDate: "",
  location: "",
  externalUrl: "",
  description: "",
};

function SubmitForm() {
  const apiFetch = useApi();
  const navigate = useNavigate();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Trim & strip empty optionals before serializing so the worker's
    // zod schema doesn't trip on "" for fields like externalUrl (URL
    // validator) or endDate (date-format validator).
    const payload: Record<string, unknown> = {
      name: state.name.trim(),
      type: state.type,
      startDate: state.startDate,
    };
    if (state.endDate) payload.endDate = state.endDate;
    if (state.location.trim()) payload.location = state.location.trim();
    if (state.externalUrl.trim()) payload.externalUrl = state.externalUrl.trim();
    if (state.description.trim()) payload.description = state.description.trim();

    setSubmitting(true);
    try {
      const res = await apiFetch("/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        throw new Error(
          body?.message ?? body?.error ?? `Submission failed (${res.status})`
        );
      }
      navigate("/events?submitted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-16 max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
        Member submission · staff-reviewed
      </p>
      <p className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6 text-balance">
        Tell us about your event.
      </p>
      <p className="text-base text-neutral-600 leading-relaxed mb-10 max-w-2xl">
        Submissions enter a staff review queue. Once approved, the event will
        appear on the Upcoming Events page and the community calendar.
        Required fields are marked with{" "}
        <span className="text-purple-600">*</span>.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-neutral-50/40 p-6 lg:p-8 space-y-6"
        noValidate
      >
        <Field
          label="Event name"
          required
          hint="The public title members will see."
        >
          <input
            type="text"
            required
            maxLength={200}
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Type" required>
          <select
            required
            value={state.type}
            onChange={(e) => update("type", e.target.value as EventType)}
            className={inputClass}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Start date" required>
            <input
              type="date"
              required
              value={state.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="End date" hint="Leave blank for a single-day event.">
            <input
              type="date"
              value={state.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Location"
          hint="City, venue, or 'Virtual' / 'Online'."
        >
          <input
            type="text"
            maxLength={200}
            value={state.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
            placeholder="e.g. Chicago, IL — or Online"
          />
        </Field>

        <Field
          label="External URL"
          hint="Official event page, registration link, or call for participation."
        >
          <input
            type="url"
            maxLength={500}
            value={state.externalUrl}
            onChange={(e) => update("externalUrl", e.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>

        <Field
          label="Description"
          hint="A short paragraph describing the event for members."
        >
          <textarea
            rows={5}
            maxLength={5000}
            value={state.description}
            onChange={(e) => update("description", e.target.value)}
            className={`${inputClass} resize-y min-h-[8rem]`}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
          <Link
            to="/events"
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-colors";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-display text-sm font-bold text-neutral-900 tracking-tight mb-1.5">
        {label}
        {required && (
          <span className="text-purple-600 ml-1" aria-label="required">
            *
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-neutral-500 mt-1.5">{hint}</span>
      )}
    </label>
  );
}

// ─── States ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <article
      className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-3 w-32 bg-neutral-100 mb-6" />
      <div className="h-12 w-2/3 bg-neutral-100 mb-4" />
      <div className="h-5 w-1/2 bg-neutral-100" />
    </article>
  );
}

function SignedOutState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-700 mb-6">
        Submit an event
      </p>
      <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6">
        Sign in to submit an event.
      </h1>
      <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        Event submissions are open to US-RSE members. Sign in with your
        member account to add your event to the community calendar.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/events"
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← back to events
        </Link>
      </div>
    </article>
  );
}
