import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import {
  useCurrentMember,
  type CurrentMember,
} from "@/hooks/useCurrentMember";
import {
  ProfileSidebar,
  type SidebarSection,
} from "@/components/profile/ProfileSidebar";
import { useApi } from "@/lib/api";
import { formatMemberId } from "@/lib/member-id";

/**
 * The Account Ledger — an editorial, document-style settings page.
 *
 * Departs deliberately from the "stack of cards" pattern that
 * settings pages default to. The page is a typographic ledger:
 * hairline rules between entries, mono section markers in the
 * gutter, no card chrome anywhere. Settings are *entries in a
 * register*, not buttons inside panels.
 *
 * Visual identity is intentionally distinct from the dossier (which
 * uses the deep purple→teal hero). The dossier is the public
 * portrait; this page is the back-office document about the
 * account. White masthead, single teal hairline accent, restrained
 * type — signaling "you're behind the curtain now."
 */

const SETTINGS_SECTIONS: SidebarSection[] = [
  { id: "section-01", number: "01", label: "Identity" },
  { id: "section-02", number: "02", label: "Visibility" },
  { id: "section-03", number: "03", label: "Notifications" },
  { id: "section-04", number: "04", label: "Profile" },
  { id: "section-05", number: "05", label: "Danger zone" },
];

export function AccountPage() {
  const { user: workosUser, isLoading: authLoading } = useAuth();
  const { status, member, error, refetch } = useCurrentMember();

  if (authLoading || status === "loading") return <SkeletonState />;
  if (status === "idle" || !workosUser) return <SignedOutState />;
  if (status === "provisioning") return <ProvisioningState />;
  if (status === "error") {
    return (
      <ErrorState
        message={error?.message ?? "Something went wrong loading your account."}
        onRetry={refetch}
      />
    );
  }
  if (!member) return <SkeletonState />;

  return <AccountLedger member={member} onMemberUpdated={refetch} />;
}

// ─── Ledger ────────────────────────────────────────────────────────────

function AccountLedger({
  member,
  onMemberUpdated,
}: {
  member: CurrentMember;
  onMemberUpdated: () => void;
}) {
  const { signOut } = useAuth();
  const profileSlug = member.profile?.slug ?? null;
  const issued = formatIssuedDate(member.createdAt);

  return (
    <article className="bg-white">
      <Masthead member={member} issued={issued} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <ProfileSidebar sections={SETTINGS_SECTIONS} />

          <div className="flex-1 min-w-0 max-w-3xl space-y-20 lg:space-y-24">
            {/* §01 · IDENTITY ─────────────────────────────────────── */}
            <LedgerSection number="01" label="Identity" accent="purple">
              <LedgerRow
                term="Email"
                value={member.email}
                action={<ImmutableMark hint="managed by WorkOS" />}
              />
              <LedgerRow
                term="Member ID"
                value={formatMemberId(member.memberId)}
                hint="Stable internal identifier — never changes."
              />
              <LedgerRow
                term="Role"
                value={member.role.replace("_", " ")}
                action={<ImmutableMark />}
              />
              {member.isLegacyImport && (
                <LedgerRow
                  term="Origin"
                  value="Imported from legacy roster"
                  hint="Your account was reconstructed from prior records."
                />
              )}
            </LedgerSection>

            {/* §02 · VISIBILITY ──────────────────────────────────── */}
            <LedgerSection
              number="02"
              label="Visibility"
              accent="teal"
              eyebrow="Who can see your dossier and how it's surfaced."
            >
              <VisibilityTriptych
                profile={member.profile}
                onSaved={onMemberUpdated}
              />
            </LedgerSection>

            {/* §03 · NOTIFICATIONS ───────────────────────────────── */}
            <LedgerSection number="03" label="Notifications" accent="amber">
              <LedgerRow
                term="Marketing"
                value={
                  member.marketingConsent
                    ? "Subscribed — newsletters & event updates"
                    : "Not subscribed"
                }
                hint="Occasional letters from US-RSE about news, awards, and the annual conference."
                action={<StubEdit />}
              />
            </LedgerSection>

            {/* §04 · PROFILE ─────────────────────────────────────── */}
            <LedgerSection number="04" label="Profile" accent="purple">
              <LedgerRow
                term="Dossier"
                value={
                  profileSlug
                    ? `/members/${profileSlug}`
                    : "Not yet established"
                }
                hint="Where the rest of the network finds you."
                action={
                  profileSlug ? (
                    <LedgerLink to={`/members/${profileSlug}`}>view →</LedgerLink>
                  ) : (
                    <ImmutableMark hint="set up a profile first" />
                  )
                }
              />
              {profileSlug && (
                <LedgerRow
                  term="Edit dossier"
                  value="Identity, career arc, recognition, works"
                  hint="The dossier editor lives on the profile itself — open it inline from any section."
                  action={
                    <LedgerLink to={`/members/${profileSlug}`}>
                      open editor →
                    </LedgerLink>
                  }
                />
              )}
            </LedgerSection>

            {/* §05 · DANGER ZONE ─────────────────────────────────── */}
            <LedgerSection number="05" label="Danger zone" accent="rose">
              <LedgerRow
                term="Sign out"
                value="End this session in this browser. Other devices stay signed in."
                action={
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-700 hover:text-rose-600 transition-colors whitespace-nowrap"
                  >
                    ↩ sign out
                  </button>
                }
              />
              <LedgerRow
                term="Delete account"
                value="Remove your records from US-RSE permanently."
                hint="Account deletion is irreversible. We're still finalizing this flow."
                action={<StubEdit label="✎ soon" />}
              />
            </LedgerSection>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Masthead ──────────────────────────────────────────────────────────

function Masthead({
  member,
  issued,
}: {
  member: CurrentMember;
  issued: string;
}) {
  const fullName =
    member.profile?.displayName ?? member.email.split("@")[0] ?? "Member";
  return (
    <header className="relative bg-white border-b border-neutral-200">
      {/* No top-of-masthead accent — the global Nav already prints a
          purple brand bar above this surface, and stacking another
          stripe right under it reads as noise. The chromatic identity
          for the ledger lives in the section accents below, not in
          the chrome. */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-10 lg:pt-16 lg:pb-14">
        <nav aria-label="Breadcrumb" className="mb-8 animate-fade-in">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-neutral-500 hover:text-purple-700 transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li>
              <span className="text-neutral-900 font-medium">Account</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 lg:col-span-9">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-purple-600 mb-5 animate-fade-in"
              style={{ animationDelay: "60ms" }}
            >
              Account · Ledger · USR-Network
            </p>
            <h1
              className="font-display text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.04] text-balance animate-slide-up"
              style={{ animationDelay: "120ms" }}
            >
              Your account,
              <br />
              <span className="text-purple-600">on the record.</span>
            </h1>
          </div>

          {/* Right-side "registry block" — typeset like the colophon
              of a printed journal. Mono, tabular, unhurried. */}
          <div
            className="col-span-12 lg:col-span-3 lg:text-right animate-fade-in"
            style={{ animationDelay: "240ms" }}
          >
            <dl className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 space-y-2">
              <div className="flex lg:flex-col lg:items-end gap-2 lg:gap-1">
                <dt className="text-neutral-400">Member</dt>
                <dd className="text-neutral-900 tabular-nums">
                  {formatMemberId(member.memberId)}
                </dd>
              </div>
              <div className="flex lg:flex-col lg:items-end gap-2 lg:gap-1">
                <dt className="text-neutral-400">Issued</dt>
                <dd className="text-neutral-900 tabular-nums">{issued}</dd>
              </div>
              <div className="flex lg:flex-col lg:items-end gap-2 lg:gap-1 pt-1">
                <dt className="text-neutral-400">Holder</dt>
                <dd className="text-neutral-700 normal-case tracking-normal text-xs font-sans truncate">
                  {fullName}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Ledger primitives (no card chrome) ───────────────────────────────

function LedgerSection({
  number,
  label,
  accent,
  eyebrow,
  children,
}: {
  number: string;
  label: string;
  accent: "purple" | "teal" | "amber" | "rose";
  eyebrow?: string;
  children: ReactNode;
}) {
  const accentColor = {
    purple: "text-purple-600 before:bg-purple-500",
    teal: "text-teal-600 before:bg-teal-500",
    amber: "text-amber-600 before:bg-amber-500",
    rose: "text-rose-600 before:bg-rose-500",
  }[accent];

  return (
    <section
      id={`section-${number}`}
      className="scroll-mt-24"
      aria-labelledby={`section-${number}-heading`}
    >
      {/* Section masthead — the section number sits before the
          label like a paragraph mark in a book index. The leading
          accent block (`before:` pseudo) is a tiny color marker, not
          a chip — restraint over decoration. */}
      <header className="mb-7 lg:mb-9">
        <div className="flex items-baseline gap-3 mb-1.5">
          <span
            className={`relative pl-3.5 font-mono text-[10px] uppercase tracking-[0.3em] ${accentColor} before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-px`}
          >
            §{number}
          </span>
          <h2
            id={`section-${number}-heading`}
            className="font-display text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight"
          >
            {label}
          </h2>
        </div>
        {eyebrow && (
          <p className="text-sm text-neutral-500 max-w-prose pl-5">
            {eyebrow}
          </p>
        )}
      </header>

      {/* Children render edge-to-edge with hairline rules; no card
          background, no rounded corners. */}
      <div className="border-t border-neutral-200">{children}</div>
    </section>
  );
}

function LedgerRow({
  term,
  value,
  hint,
  action,
}: {
  term: string;
  value: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="group relative grid grid-cols-12 gap-4 lg:gap-6 py-5 pl-4 lg:pl-5 pr-1 border-b border-neutral-200 transition-colors hover:bg-neutral-50/40">
      {/* Hover hairline — borrowed from MemberCard, same motion
          family. Sits inside the row's left padding gutter so it
          floats next to the term text instead of overlapping it. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-teal-500 origin-top scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100"
      />
      <dt className="col-span-12 sm:col-span-3 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 pt-1">
        {term}
      </dt>
      <dd className="col-span-12 sm:col-span-6 min-w-0">
        <p className="text-base text-neutral-900 leading-snug break-words">
          {value}
        </p>
        {hint && (
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed max-w-prose">
            {hint}
          </p>
        )}
      </dd>
      {action && (
        <div className="col-span-12 sm:col-span-3 flex sm:justify-end items-start pt-1">
          {action}
        </div>
      )}
    </div>
  );
}

function LedgerLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-mono text-[11px] uppercase tracking-[0.25em] text-purple-600 hover:text-purple-800 transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

function ImmutableMark({ hint }: { hint?: string }) {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 whitespace-nowrap"
      title={hint}
    >
      🔒 read-only{hint ? "" : ""}
    </span>
  );
}

function StubEdit({ label = "✎ soon" }: { label?: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 whitespace-nowrap">
      {label}
    </span>
  );
}

// ─── Visibility triptych (the centerpiece) ────────────────────────────

type Visibility = "public" | "listed" | "hidden";

interface VisibilityOption {
  value: Visibility;
  marker: string;
  label: string;
  oneLiner: string;
  detail: string;
  accent: "teal" | "purple" | "neutral";
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "public",
    marker: "α",
    label: "Public",
    oneLiner: "Listed and viewable.",
    detail:
      "Your full dossier is visible at /members/your-slug. You appear in directory and search.",
    accent: "teal",
  },
  {
    value: "listed",
    marker: "β",
    label: "Listed (private)",
    oneLiner: "In the directory by name only.",
    detail:
      "You appear in the directory and command palette so members can find you, but visitors see only a stub — not your dossier.",
    accent: "purple",
  },
  {
    value: "hidden",
    marker: "γ",
    label: "Hidden",
    oneLiner: "Not listed anywhere.",
    detail:
      "You don't appear in the directory or search. The link still works for people who already have it, but the page renders the stub.",
    accent: "neutral",
  },
];

function visibilityFromProfile(
  isPublic: boolean,
  isDiscoverable: boolean
): Visibility {
  if (isPublic) return "public";
  if (isDiscoverable) return "listed";
  return "hidden";
}

function visibilityToFlags(v: Visibility): {
  isPublic: boolean;
  isDiscoverable: boolean;
} {
  if (v === "public") return { isPublic: true, isDiscoverable: false };
  if (v === "listed") return { isPublic: false, isDiscoverable: true };
  return { isPublic: false, isDiscoverable: false };
}

function VisibilityTriptych({
  profile,
  onSaved,
}: {
  profile: CurrentMember["profile"];
  onSaved: () => void;
}) {
  const apiFetch = useApi();
  const initial = visibilityFromProfile(
    profile?.isPublic ?? true,
    profile?.isDiscoverable ?? false
  );
  const [pending, setPending] = useState<Visibility | null>(null);
  const [current, setCurrent] = useState<Visibility>(initial);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync if a parent refresh lands a different
  // value (e.g., after the user edits via another surface).
  useEffect(() => {
    setCurrent(initial);
  }, [initial]);

  if (!profile) {
    return (
      <div className="border-b border-neutral-200 py-6 px-1 text-sm text-neutral-500">
        Establish a profile first — visibility settings appear once your
        dossier exists.
      </div>
    );
  }

  async function selectVisibility(next: Visibility) {
    if (pending || next === current) return;
    setPending(next);
    setError(null);
    const flags = visibilityToFlags(next);
    try {
      const res = await apiFetch("/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flags),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { message?: string } | null)?.message ??
            `Save failed (${res.status})`
        );
      }
      setCurrent(next);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="border-b border-neutral-200 pb-2">
      {/* The triptych itself — three columns separated by gap-px
          gradient seams, matching the Affiliation pillar pattern on
          the dossier. No card backgrounds; the visual frame comes
          from the seam, the accent stripe on top of each column,
          and the typography. */}
      <div
        role="radiogroup"
        aria-label="Profile visibility"
        className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gradient-to-r from-teal-200 via-purple-200 to-neutral-200"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <VisibilityOptionCell
            key={opt.value}
            option={opt}
            active={current === opt.value}
            pending={pending === opt.value}
            disabled={pending !== null && pending !== opt.value}
            onSelect={() => selectVisibility(opt.value)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 px-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {pending
            ? "amending…"
            : `current state · ${labelFor(current).toLowerCase()}`}
        </p>
        {error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rose-600">
            ! {error}
          </p>
        )}
      </div>
    </div>
  );
}

function labelFor(v: Visibility): string {
  return VISIBILITY_OPTIONS.find((o) => o.value === v)?.label ?? "";
}

function VisibilityOptionCell({
  option,
  active,
  pending,
  disabled,
  onSelect,
}: {
  option: VisibilityOption;
  active: boolean;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const accentBar = {
    teal: "bg-teal-500",
    purple: "bg-purple-500",
    neutral: "bg-neutral-300",
  }[option.accent];
  const accentText = {
    teal: "text-teal-700",
    purple: "text-purple-700",
    neutral: "text-neutral-600",
  }[option.accent];
  const activeBg = {
    teal: "bg-teal-50/60",
    purple: "bg-purple-50/60",
    neutral: "bg-neutral-50",
  }[option.accent];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-busy={pending}
      disabled={disabled}
      onClick={onSelect}
      className={`relative h-full flex flex-col text-left p-6 lg:p-7 pb-12 lg:pb-14 transition-all min-h-[14rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-inset ${
        active ? activeBg : "bg-white hover:bg-neutral-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Top accent stripe — flat rectangle, full column width. No
          rounded edges: stripes here are register-entry bars, not
          decorative pills. Inactive options dim it instead of
          hiding it so the triptych still reads as three sibling
          columns at a glance. */}
      <span
        aria-hidden="true"
        className={`absolute top-0 left-0 right-0 h-[3px] ${accentBar} ${
          active ? "opacity-100" : "opacity-30"
        } transition-opacity`}
      />

      <div className="flex items-baseline gap-2 mt-3 mb-3">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accentText}`}
        >
          {option.marker}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {active ? "active" : "available"}
        </span>
      </div>

      <p className="font-display text-xl lg:text-2xl font-semibold text-neutral-900 tracking-tight leading-tight mb-2">
        {option.label}
      </p>
      <p className="text-sm font-medium text-neutral-700 mb-3">
        {option.oneLiner}
      </p>
      {/* Detail claims the remaining vertical space (flex-1) so the
          three columns end at the same baseline regardless of how
          long each detail string runs. The "✓ on file" mark stays
          pinned to the absolute bottom-right corner. */}
      <p className="text-xs text-neutral-500 leading-relaxed flex-1">
        {option.detail}
      </p>

      {/* Active mark — a small mono confirmation in the bottom-right
          rather than a checkmark icon. Reads as "registry entry" not
          "form input." */}
      {active && (
        <span
          aria-hidden="true"
          className={`absolute bottom-5 right-6 font-mono text-[10px] uppercase tracking-[0.3em] ${accentText}`}
        >
          ✓ on file
        </span>
      )}
    </button>
  );
}

// ─── States ────────────────────────────────────────────────────────────

function SignedOutState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Account ledger
      </p>
      <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6">
        Sign in to view the ledger.
      </h1>
      <p className="text-lg text-neutral-600 leading-relaxed mb-10 max-w-xl mx-auto">
        Your account ledger lives behind authentication. Sign in with your
        member account to view and update the entries.
      </p>
      <Link
        to="/sign-in"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
      >
        Sign in
      </Link>
    </article>
  );
}

function ProvisioningState() {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        One moment
      </p>
      <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
        Drafting your ledger…
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
        We're finishing the handshake between WorkOS and our database. This
        usually takes a second or two.
      </p>
      <div
        className="mt-10 inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse"
        aria-hidden="true"
      />
    </article>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
        Something broke
      </p>
      <h1 className="font-display text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-4">
        We couldn't load your account.
      </h1>
      <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto mb-8">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
      >
        Try again
      </button>
    </article>
  );
}

function SkeletonState() {
  return (
    <article
      className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-24 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-3 w-32 bg-neutral-100 mb-6" />
      <div className="h-12 w-2/3 bg-neutral-100 mb-4" />
      <div className="h-5 w-1/2 bg-neutral-100 mb-12" />
      <div className="space-y-12">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-neutral-100" />
          <div className="h-px w-full bg-neutral-200" />
          <div className="h-12 w-full bg-neutral-100" />
          <div className="h-12 w-full bg-neutral-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-neutral-100" />
          <div className="h-px w-full bg-neutral-200" />
          <div className="h-40 w-full bg-neutral-100 rounded-3xl" />
        </div>
      </div>
    </article>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function formatIssuedDate(iso: string): string {
  // Match Safari-safe parsing: Postgres timestamps from Neon's HTTP
  // driver sometimes come back with a space separator.
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}
