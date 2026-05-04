import { useState, type FormEvent } from "react";
import { Portrait } from "./Portrait";
import { SectionFrame, NotYetWritten } from "./SectionFrame";
import { useApi } from "@/lib/api";
import type { CurrentMember } from "@/hooks/useCurrentMember";

interface IdentitySectionProps {
  member: CurrentMember;
  isOwner: boolean;
  initials: string;
  onSaved?: (next: CurrentMember) => void;
}

interface IdentityField {
  displayName: string;
  slug: string;
  headline: string;
  bio: string;
  jobTitle: string;
  photoUrl: string;
  region: string;
  city: string;
  publicLocation: string;
  showOnMap: boolean;
  isPublic: boolean;
}

function fieldsFromMember(member: CurrentMember): IdentityField {
  const p = member.profile;
  return {
    displayName: p?.displayName ?? "",
    slug: p?.slug ?? "",
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    jobTitle: p?.jobTitle ?? "",
    photoUrl: p?.photoUrl ?? "",
    region: "",
    city: "",
    publicLocation: p?.publicLocation ?? "",
    showOnMap: p?.showOnMap ?? false,
    isPublic: p?.isPublic ?? true,
  };
}

export function IdentitySection({
  member,
  isOwner,
  initials,
  onSaved,
}: IdentitySectionProps) {
  const [editing, setEditing] = useState(false);

  return (
    <SectionFrame
      number="01"
      eyebrow="Identity"
      action={
        isOwner ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-600 transition-colors"
          >
            {editing ? "↩ cancel" : "✎ edit"}
          </button>
        ) : null
      }
    >
      {editing ? (
        <IdentityEditor
          member={member}
          onCancel={() => setEditing(false)}
          onSaved={(next) => {
            setEditing(false);
            onSaved?.(next);
          }}
        />
      ) : (
        <IdentityRead member={member} initials={initials} />
      )}
    </SectionFrame>
  );
}

function IdentityRead({
  member,
  initials,
}: {
  member: CurrentMember;
  initials: string;
}) {
  const profile = member.profile;
  const headline = profile?.headline ?? null;
  const bio = profile?.bio ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-5">
        <Portrait
          photoUrl={profile?.photoUrl ?? null}
          initials={initials}
          memberId={member.memberId}
        />
        <div className="space-y-1 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          <p>
            <span className="text-neutral-400">role · </span>
            {member.role.replace("_", " ")}
          </p>
          {profile?.jobTitle && (
            <p>
              <span className="text-neutral-400">title · </span>
              <span className="normal-case tracking-normal text-neutral-800 font-sans text-sm">
                {profile.jobTitle}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        {headline ? (
          <blockquote className="mb-10 border-l-2 border-purple-500 pl-6 lg:pl-8">
            <p className="font-display text-2xl lg:text-3xl text-neutral-900 leading-snug text-balance">
              {headline}
            </p>
          </blockquote>
        ) : (
          <div className="mb-10">
            <NotYetWritten message="01.a · headline not yet written" />
          </div>
        )}

        {bio ? (
          <div className="prose-editorial">
            <p className="text-base lg:text-lg text-neutral-700 leading-relaxed whitespace-pre-line">
              {bio}
            </p>
          </div>
        ) : (
          <NotYetWritten message="01.b · bio not yet written" />
        )}

        <div className="mt-10 pt-10 border-t border-neutral-200">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
            01.c · I am
          </p>
          {member.engagementTypes && member.engagementTypes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {member.engagementTypes.map((e) => (
                <li
                  key={e.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-medium text-purple-700"
                >
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-purple-500"
                  />
                  {e.label}
                </li>
              ))}
            </ul>
          ) : (
            <NotYetWritten message="engagement types not yet selected" />
          )}
        </div>
      </div>
    </div>
  );
}

function IdentityEditor({
  member,
  onCancel,
  onSaved,
}: {
  member: CurrentMember;
  onCancel: () => void;
  onSaved: (next: CurrentMember) => void;
}) {
  const apiFetch = useApi();
  const [fields, setFields] = useState<IdentityField>(() =>
    fieldsFromMember(member)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ path: string; message: string }[]>([]);

  function set<K extends keyof IdentityField>(key: K, value: IdentityField[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setIssues([]);

    const body: Record<string, unknown> = {
      displayName: fields.displayName.trim() || undefined,
      slug: fields.slug.trim() || undefined,
      headline: fields.headline.trim() || null,
      bio: fields.bio.trim() || null,
      jobTitle: fields.jobTitle.trim() || null,
      photoUrl: fields.photoUrl.trim() || null,
      publicLocation: fields.publicLocation.trim() || null,
      showOnMap: fields.showOnMap,
      isPublic: fields.isPublic,
    };
    Object.keys(body).forEach((k) => {
      if (body[k] === undefined) delete body[k];
    });

    try {
      const res = await apiFetch("/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as
        | { ok: true; user: CurrentMember }
        | {
            ok: false;
            error: string;
            message?: string;
            issues?: { path: (string | number)[]; message: string }[];
          };

      if (!res.ok || !json.ok) {
        if (!json.ok) {
          if (json.issues) {
            setIssues(
              json.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              }))
            );
          }
          setError(json.message ?? json.error);
        } else {
          setError(`Save failed (${res.status})`);
        }
        return;
      }

      onSaved(json.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12"
    >
      <div className="lg:col-span-5 space-y-6">
        <Field label="Display name" id="displayName" required>
          <input
            id="displayName"
            type="text"
            value={fields.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            className="editorial-input"
            placeholder="How you want to appear"
          />
        </Field>
        <Field
          label="Slug"
          id="slug"
          required
          hint="lowercase-kebab-case · used in /members/your-slug"
        >
          <input
            id="slug"
            type="text"
            value={fields.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
            className="editorial-input font-mono"
            placeholder="your-name"
          />
        </Field>
        <Field label="Job title" id="jobTitle">
          <input
            id="jobTitle"
            type="text"
            value={fields.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
            className="editorial-input"
            placeholder="Research Software Engineer"
          />
        </Field>
        <Field
          label="Photo URL"
          id="photoUrl"
          hint="upload coming later — paste a URL for now"
        >
          <input
            id="photoUrl"
            type="url"
            value={fields.photoUrl}
            onChange={(e) => set("photoUrl", e.target.value)}
            className="editorial-input"
            placeholder="https://…"
          />
        </Field>
        <Field
          label="Public location"
          id="publicLocation"
          hint="how location appears on your profile"
        >
          <input
            id="publicLocation"
            type="text"
            value={fields.publicLocation}
            onChange={(e) => set("publicLocation", e.target.value)}
            className="editorial-input"
            placeholder="Seattle, Washington"
          />
        </Field>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <Field
          label="Headline"
          id="headline"
          hint="one line · the pull-quote at the top of your profile"
        >
          <input
            id="headline"
            type="text"
            value={fields.headline}
            onChange={(e) => set("headline", e.target.value)}
            className="editorial-input"
            maxLength={140}
            placeholder="A single sentence that captures who you are"
          />
        </Field>
        <Field
          label="Bio"
          id="bio"
          hint="long form · plain text · paragraphs welcome"
        >
          <textarea
            id="bio"
            value={fields.bio}
            onChange={(e) => set("bio", e.target.value)}
            className="editorial-textarea"
            rows={10}
            maxLength={5000}
            placeholder="Tell the community who you are, what you build, what you care about."
          />
        </Field>

        <fieldset className="border-t border-neutral-200 pt-6">
          <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
            Visibility
          </legend>
          <div className="space-y-4">
            <Toggle
              label="Public profile"
              hint="anyone with the link can view"
              checked={fields.isPublic}
              onChange={(v) => set("isPublic", v)}
            />
            <Toggle
              label="Show on community map"
              hint="if location is set"
              checked={fields.showOnMap}
              onChange={(v) => set("showOnMap", v)}
            />
          </div>
        </fieldset>

        {issues.length > 0 && (
          <ul className="text-sm text-rose-700 space-y-1">
            {issues.map((i, idx) => (
              <li key={idx}>
                <span className="font-mono text-xs">{i.path}:</span> {i.message}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-rose-700">{error}</p>}

        <div className="flex items-center gap-5 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {saving ? "Saving…" : "Save identity"}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ↩ cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  hint,
  required,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 flex items-baseline gap-2"
      >
        {label}
        {required && <span className="text-purple-600">*</span>}
        {hint && (
          <span className="text-neutral-400 normal-case tracking-normal text-[11px] font-sans">
            — {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span
        className={`relative mt-0.5 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-teal-500" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-neutral-900">
          {label}
        </span>
        {hint && (
          <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}
